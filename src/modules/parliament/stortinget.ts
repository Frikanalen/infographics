// Reads the Storting's meeting plan and agendas from data.stortinget.no,
// through this template's own server (stortinget/... next to the page).
// Open data under NLOD; the page names Stortinget as its source.
//
// The plan lists every day of the session. A day with a meeting has
// mote_ting 1. The meeting gets an id, and with it an agenda, about two
// days ahead; until then the id is -1.

export interface AgendaItem {
  number: number
  text: string
}

export interface SittingDay {
  /** Norwegian date, "2026-11-12". */
  date: string
  /** When the meeting starts. */
  start: number
  /** What is on the agenda, or null while it has not been published. */
  agenda: AgendaItem[] | null
  /** Notes from the plan, such as "Votering kl. 15.00". */
  notes: string[]
}

/** The meeting days around now: the last one before today, today's, and the next. */
export type Sittings = SittingDay[]

interface RawMeeting {
  id: number
  mote_dato_tid: string
  mote_ting: number
  ikke_motedag_tekst: string | null
  merknad: string | null
}
interface RawAgendaItem {
  dagsordensak_nummer: number
  dagsordensak_tekst: string
}

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })
/** The Norwegian date of an instant, "2026-11-12". */
export const dayKey = (at: Date | number) => dayKeyFormat.format(at)

/** Milliseconds from the API's "/Date(1794438000000+0100)/". */
export function parseApiDate(text: string): number {
  const match = /\/Date\((-?\d+)/.exec(text)
  if (!match) throw new Error(`Stortinget: unknown date ${text}`)
  return Number(match[1])
}

/** The session runs from 1 October: "2026-2027". */
export function sessionId(now: Date): string {
  const [year, month] = dayKey(now).split("-").map(Number)
  const first = month >= 10 ? year : year - 1
  return `${first}-${first + 1}`
}

/** "-PACE. Strasbourg<BR>-Votering kl. 15.00" becomes its separate notes. */
export function parseNotes(merknad: string | null): string[] {
  return (merknad ?? "")
    .split(/<br\s*\/?>/i)
    .map((note) => note.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean)
}

/**
 * An agenda line without its preamble. Most lines open with which committee
 * the recommendation is from and which members put the proposal; on screen
 * there is room for what it is about.
 */
export function shortTitle(text: string): string {
  const short = text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^Innstilling(er)? fr[aå] .*?komit[eé]en om /i, "")
    .replace(/^(Representantforslag|Grunnlovsforslag) fr[aå] .*? om /i, "$1 om ")
  return short.charAt(0).toUpperCase() + short.slice(1)
}

export function parseAgenda(items: RawAgendaItem[]): AgendaItem[] {
  return items
    .map((item) => ({ number: item.dagsordensak_nummer, text: shortTitle(item.dagsordensak_tekst ?? "") }))
    // Every agenda ends with "Referat", a formality.
    .filter((item) => item.text && item.text !== "Referat")
    .sort((a, b) => a.number - b.number)
}

interface PlannedDay {
  date: string
  start: number
  ids: number[]
  notes: string[]
}

/** The plan's meeting days in order, one per date even when a day has two meetings. */
export function meetingDays(meetings: RawMeeting[]): PlannedDay[] {
  const days = new Map<string, PlannedDay>()
  for (const meeting of meetings) {
    if (meeting.mote_ting !== 1 || meeting.ikke_motedag_tekst) continue
    const start = parseApiDate(meeting.mote_dato_tid)
    const date = dayKey(start)
    const day = days.get(date) ?? { date, start, ids: [], notes: [] }
    day.start = Math.min(day.start, start)
    if (meeting.id > 0) day.ids.push(meeting.id)
    for (const note of parseNotes(meeting.merknad)) if (!day.notes.includes(note)) day.notes.push(note)
    days.set(date, day)
  }
  return [...days.values()].sort((a, b) => a.start - b.start)
}

/** The last meeting day before today, today's if there is one, and the next. */
export function around<T extends { date: string }>(days: T[], now: Date): T[] {
  const today = dayKey(now)
  const before = days.filter((day) => day.date < today).at(-1)
  const after = days.find((day) => day.date > today)
  return [before, days.find((day) => day.date === today), after].filter((day) => day !== undefined)
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`stortinget/${path}`)
  if (!response.ok) throw new Error(`Stortinget: ${response.status}`)
  return response.json()
}

async function fetchSittings(now: Date): Promise<Sittings | null> {
  const plan = await get<{ moter_liste: RawMeeting[] }>(`moter?sesjonid=${sessionId(now)}&format=json`)
  const days = around(meetingDays(plan.moter_liste), now)
  if (!days.length) return null
  return Promise.all(
    days.map(async (day) => {
      const agendas = await Promise.all(
        day.ids.map((id) => get<{ dagsordensak_liste: RawAgendaItem[] }>(`dagsorden?moteid=${id}&format=json`)),
      )
      return {
        date: day.date,
        start: day.start,
        agenda: day.ids.length ? agendas.flatMap((agenda) => parseAgenda(agenda.dagsordensak_liste ?? [])) : null,
        notes: day.notes,
      }
    }),
  )
}

// The two halves of the page are separate modules that show the same data,
// so they share one fetch.
let latest: { at: number; sittings: Promise<Sittings | null> } | undefined
export function loadSittings(now: Date): Promise<Sittings | null> {
  if (!latest || now.getTime() - latest.at > 60000) {
    latest = { at: now.getTime(), sittings: fetchSittings(now) }
    latest.sittings.catch(() => (latest = undefined))
  }
  return latest.sittings
}

export type Slot = "first" | "second"
export interface Shown {
  /** "I går", "I dag", "I morgen", or "Forrige møte" / "Neste møte" when the day is further off. */
  label: string
  /** The Norwegian date the half is about. */
  date: string
  /** The meeting that day, or undefined when the Storting does not meet. */
  day?: SittingDay
}

function shiftDay(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** When the working day starts on a day without a meeting: 10:00, as most meetings do. */
const DEFAULT_START_MINUTES = 600

/**
 * What each half of the page shows. Until today's meeting starts: the last
 * meeting day on the left and today on the right. From then on: today on the
 * left and the next meeting day on the right.
 */
export function shownIn(slot: Slot, sittings: Sittings, now: Date, minutesNow: number): Shown {
  const today = dayKey(now)
  const todays = sittings.find((day) => day.date === today)
  const started = todays ? now.getTime() >= todays.start : minutesNow >= DEFAULT_START_MINUTES
  const wantsToday = (slot === "second") !== started
  if (wantsToday) return { label: "I dag", date: today, day: todays }
  if (slot === "first") {
    const day = sittings.filter((d) => d.date < today).at(-1)
    const yesterday = shiftDay(today, -1)
    if (!day) return { label: "I går", date: yesterday }
    return { label: day.date === yesterday ? "I går" : "Forrige møte", date: day.date, day }
  }
  const day = sittings.find((d) => d.date > today)
  const tomorrow = shiftDay(today, 1)
  if (!day) return { label: "I morgen", date: tomorrow }
  return { label: day.date === tomorrow ? "I morgen" : "Neste møte", date: day.date, day }
}
