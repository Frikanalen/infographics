// Reads the Storting's meeting plan and agendas from data.stortinget.no,
// through this template's own server (stortinget/... next to the page).
// Open data under NLOD; the page names Stortinget as its source.
//
// The plan lists every day of the session. A day with a meeting has
// mote_ting 1. The meeting gets an id, and with it an agenda, about two
// days ahead; until then the id is -1.

export interface AgendaItem {
  number: number
  /** What the matter is about. */
  text: string
  /** Where it comes from: the committee and who put the proposal. */
  from?: string
  /** A remark the agenda carries with the item. */
  remark?: string
  /** The Storting's id for the matter, when it has one. Votes are looked up by it. */
  sakId?: number
  /** How it went, once it has been voted on: one line for each vote. */
  results?: Result[]
}

export interface Result {
  /** "Ikke vedtatt, med 71 mot 29 stemmer" */
  line: string
  /** What was voted through, in the Storting's words, when that adds something. */
  text?: string
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
  sak_id?: number
}
export interface RawVote {
  votering_id: number
  /** The other half of an alternative vote, or -1. */
  alternativ_votering_id: number
  /** The agenda number of the meeting (dagsorden_nummer), not the meeting id. */
  mote_kart_nummer: number
  dagsorden_sak_nummer: number
  vedtatt: boolean
  /** Counts of those present, or -1 when the vote was not counted. */
  antall_for: number
  antall_mot: number
  /** "Enstemmig vedtatt", or null for a counted vote. */
  votering_resultat_type_tekst: string | null
}
export interface RawProposal {
  /** "Komiteens tilråding", "Forslag nr. 1 fra Fremskrittspartiet", or null. */
  forslag_betegnelse: string | null
  /** The proposal as HTML. */
  forslag_tekst: string | null
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

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * An agenda line, taken apart. Most lines open with which committee the
 * recommendation is from and which members put the proposal. That goes in
 * `from`, so the first thing on screen is what the matter is about. Nothing
 * is thrown away. Lines after the first are remarks, such as
 * "(Redegjørelsen holdt i Stortingets møte 10. november 2026)".
 */
export function parseItemText(raw: string): Omit<AgendaItem, "number"> {
  const [first = "", ...rest] = raw.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim())
  const from: string[] = []
  let text = first.replace(/^(Innstilling(?:er)? fr[aå] .*?komit[eé]en) om /i, (_, committee: string) => {
    from.push(committee)
    return ""
  })
  text = text.replace(
    /^(Representantforslag|Grunnlovsforslag) fr[aå] (?:stortingsrepresentant(?:ene|ane|en) )?(.*?) om /i,
    (_, kind: string, members: string) => {
      from.push(`${from.length ? "forslag" : "Forslag"} fra ${members}`)
      return `${kind} om `
    },
  )
  const remark = rest.filter(Boolean).join(" ").replace(/^\((.*)\)$/, "$1")
  return {
    text: capital(text),
    ...(from.length ? { from: from.join(", ") } : {}),
    ...(remark ? { remark } : {}),
  }
}

export function parseAgenda(items: RawAgendaItem[]): AgendaItem[] {
  return items
    .map((item) => ({
      number: item.dagsordensak_nummer,
      ...parseItemText(item.dagsordensak_tekst ?? ""),
      ...(item.sak_id && item.sak_id > 0 ? { sakId: item.sak_id } : {}),
    }))
    // Every agenda ends with "Referat", a formality.
    .filter((item) => item.text && item.text !== "Referat")
    .sort((a, b) => a.number - b.number)
}

/**
 * The votes on one agenda item of one meeting. A matter can be voted on at
 * several meetings; `agendaNumber` is the meeting's dagsorden_nummer. An
 * alternative vote comes as two mirror rows: the one that carried is kept.
 */
export function votesOn(votes: RawVote[], agendaNumber: number, itemNumber: number): RawVote[] {
  return votes.filter(
    (vote) =>
      vote.mote_kart_nummer === agendaNumber &&
      vote.dagsorden_sak_nummer === itemNumber &&
      (vote.alternativ_votering_id <= 0 || vote.vedtatt),
  )
}

/** Plain text from the API's HTML. */
export const plainText = (html: string | null) =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

// A text longer than this is a law or a budget, not something to read on a screen.
const LONGEST_TEXT = 400

/**
 * One vote in words. `proposal` is what the vote was on, when it has been
 * looked up. Mind that "vedtatt" in the data means the motion voted on
 * carried, and the motion is very often the committee's recommendation to
 * turn a proposal down: its text then ends "– vedtas ikke", and the plain
 * way to say it is that the proposal was not adopted.
 */
export function resultOf(vote: RawVote, proposal?: RawProposal): Result {
  const counted = vote.antall_for >= 0 && vote.antall_mot >= 0
  if (!counted) return { line: vote.votering_resultat_type_tekst ?? (vote.vedtatt ? "Vedtatt" : "Ikke vedtatt") }
  const what = proposal?.forslag_betegnelse?.trim()
  const text = plainText(proposal?.forslag_tekst ?? null)
  if (!vote.vedtatt)
    return { line: `${what ?? "Forslaget"} fikk ${vote.antall_for} mot ${vote.antall_mot} stemmer og ble ikke vedtatt` }
  const votes = `med ${vote.antall_for} mot ${vote.antall_mot} stemmer`
  if (/[–-]\s*vedtas ikke\.?$/.test(text)) return { line: `Ikke vedtatt, ${votes}` }
  return {
    line: `${what ?? "Forslaget"} vedtatt ${votes}`,
    ...(text && text.length <= LONGEST_TEXT ? { text } : {}),
  }
}

/** Several votes on one matter are counted up instead of listed. */
const MOST_VOTES_LISTED = 3
export function summaryOf(votes: RawVote[]): Result {
  const carried = votes.filter((vote) => vote.vedtatt).length
  return { line: `${votes.length} voteringer: ${carried} vedtatt, ${votes.length - carried} ikke vedtatt` }
}

// How much room an item takes on a full-width page, estimated from its
// length, so a long agenda can be split over several screens without
// measuring text. The figures are on the careful side.
const TEXT_PER_LINE = 54
const TEXT_LINE = 36
const DETAIL_PER_LINE = 66
const DETAIL_LINE = 29
const ROW_PADDING = 34
const ROOM = 440

const lines = (text: string | undefined, perLine: number) => (text ? Math.ceil(text.length / perLine) : 0)
export const itemHeight = (item: AgendaItem) =>
  ROW_PADDING +
  lines(item.text, TEXT_PER_LINE) * TEXT_LINE +
  (lines(item.from, DETAIL_PER_LINE) +
    lines(item.remark, DETAIL_PER_LINE) +
    (item.results ?? []).reduce(
      (sum, result) => sum + lines(result.line, DETAIL_PER_LINE) + lines(result.text, DETAIL_PER_LINE),
      0,
    )) *
    DETAIL_LINE

/** The agenda in screens, each with as many whole items as fit. */
export function screens(agenda: AgendaItem[]): AgendaItem[][] {
  const out: AgendaItem[][] = []
  let used = 0
  for (const item of agenda) {
    const height = itemHeight(item)
    if (!out.length || used + height > ROOM) {
      out.push([])
      used = 0
    }
    out.at(-1)!.push(item)
    used += height
  }
  return out
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

/** How the items of a meeting that has started went, from the votes on each matter. */
async function withResults(agenda: AgendaItem[], agendaNumber: number): Promise<AgendaItem[]> {
  return Promise.all(
    agenda.map(async (item) => {
      if (!item.sakId) return item
      const all = await get<{ sak_votering_liste: RawVote[] }>(`voteringer?sakid=${item.sakId}&format=json`)
      const votes = votesOn(all.sak_votering_liste ?? [], agendaNumber, item.number)
      if (!votes.length) return item
      if (votes.length > MOST_VOTES_LISTED) return { ...item, results: [summaryOf(votes)] }
      const results = await Promise.all(
        votes.map(async (vote) => {
          // A vote that was not counted has no proposal to look up.
          if (vote.antall_for < 0) return resultOf(vote)
          const proposals = await get<{ voteringsforslag_liste: RawProposal[] }>(
            `voteringsforslag?voteringid=${vote.votering_id}&format=json`,
          )
          const list = proposals.voteringsforslag_liste ?? []
          return resultOf(vote, list.length === 1 ? list[0] : undefined)
        }),
      )
      return { ...item, results }
    }),
  )
}

async function fetchSittings(now: Date): Promise<Sittings | null> {
  const plan = await get<{ moter_liste: RawMeeting[] }>(`moter?sesjonid=${sessionId(now)}&format=json`)
  const days = around(meetingDays(plan.moter_liste), now)
  if (!days.length) return null
  return Promise.all(
    days.map(async (day) => {
      const agendas = await Promise.all(
        day.ids.map(async (id) => {
          const agenda = await get<{ dagsorden_nummer: number; dagsordensak_liste: RawAgendaItem[] }>(
            `dagsorden?moteid=${id}&format=json`,
          )
          const items = parseAgenda(agenda.dagsordensak_liste ?? [])
          return day.start <= now.getTime() ? withResults(items, agenda.dagsorden_nummer) : items
        }),
      )
      return {
        date: day.date,
        start: day.start,
        agenda: day.ids.length ? agendas.flat() : null,
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
