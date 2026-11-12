// Reads Frikanalen's own schedule from the public API. It allows a web page
// to call it directly.

export interface Programme {
  start: string
  end: string
  title: string
  /** The member organisation behind it. */
  by: string
}

interface Item {
  starttime: string
  endtime: string
  defaultName?: string
  video: { name: string; organization: { name: string } | null } | null
}

export function parseSchedule(items: Item[]): Programme[] {
  return items
    .map((item) => ({
      start: item.starttime,
      end: item.endtime,
      title: (item.video?.name || item.defaultName || "").replace(/\s+/g, " ").trim(),
      by: item.video?.organization?.name ?? "",
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

export async function loadSchedule(): Promise<Programme[]> {
  // Two days, so that late in the evening there is a first programme of tomorrow to name.
  const response = await fetch("https://frikanalen.tv/api/scheduleitems?date=today&days=2")
  if (!response.ok) throw new Error(`Frikanalen: ${response.status}`)
  const body: { results: Item[] } = await response.json()
  return parseSchedule(body.results)
}
