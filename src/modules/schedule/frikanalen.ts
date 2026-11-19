// Reads Frikanalen's own schedule from the public API. It allows a web page
// to call it directly.

export interface Programme {
  start: string
  end: string
  title: string
  /** The member organisation behind it. */
  by: string
  /** The airtime grant it airs in, and the organisation holding that airtime. */
  grant?: number
  holder?: string
}

/** A window of airtime and the organisation holding it, from /api/grants/public. */
export interface Grant {
  id: number
  organization: { id: number; name: string; fkmember?: boolean }
  starttime: string
  endtime: string
}

interface Item {
  starttime: string
  endtime: string
  defaultName?: string
  grant?: number | null
  video: { name: string; organization: { name: string } | null } | null
}

export function parseSchedule(items: Item[], grants: Grant[] = []): Programme[] {
  const holders = new Map(grants.map((grant) => [grant.id, grant.organization.name]))
  return items
    .map((item) => ({
      start: item.starttime,
      end: item.endtime,
      title: (item.video?.name || item.defaultName || "").replace(/\s+/g, " ").trim(),
      by: item.video?.organization?.name ?? "",
      ...(item.grant != null && holders.has(item.grant)
        ? { grant: item.grant, holder: holders.get(item.grant) }
        : {}),
    }))
    .filter((programme) => programme.title)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
}

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })

export const isOn = (programme: Programme, now: Date) =>
  Date.parse(programme.start) <= now.getTime() && now.getTime() < Date.parse(programme.end)

/**
 * What is on now and what is left of today, in order. When today is over,
 * `next` is the first programme of a later day.
 */
export function restOfDay(programmes: Programme[], now: Date): { today: Programme[]; next?: Programme } {
  const day = dayKey.format(now)
  const today = programmes.filter(
    (p) => isOn(p, now) || (Date.parse(p.start) > now.getTime() && dayKey.format(new Date(p.start)) === day),
  )
  if (today.length) return { today }
  return { today, next: programmes.find((p) => Date.parse(p.start) > now.getTime()) }
}

/**
 * What a row says beside the title. The first programme of a run in the same
 * airtime names who holds it; the ones after it leave that out, unless
 * someone else made the programme. Outside any airtime it is the maker.
 */
export function creditOf(programmes: Programme[], index: number): string {
  const programme = programmes[index]
  if (!programme.holder) return programme.by
  if (programme.by && programme.by !== programme.holder) return programme.by
  return index > 0 && programmes[index - 1].grant === programme.grant ? "" : programme.holder
}

const API = "https://frikanalen.tv/api"

/** Whose airtime the coming `days` are. Throws when the API cannot say. */
export async function loadGrants(days = 1): Promise<Grant[]> {
  const response = await fetch(`${API}/grants/public?days=${days}`)
  if (!response.ok) throw new Error(`Frikanalen: ${response.status}`)
  return response.json()
}

export async function loadSchedule(): Promise<Programme[]> {
  // Two days, so that late in the evening there is a first programme of tomorrow to name.
  const [response, grants] = await Promise.all([
    fetch(`${API}/scheduleitems?date=today&days=2`),
    // The schedule is worth showing without its airtime holders.
    loadGrants(2).catch(() => []),
  ])
  if (!response.ok) throw new Error(`Frikanalen: ${response.status}`)
  const body: { results: Item[] } = await response.json()
  return parseSchedule(body.results, grants)
}
