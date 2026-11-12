// Frikanalen is a Norwegian channel: every clock and date on screen is
// Norwegian time, whatever the playout machine is set to.
const ZONE = "Europe/Oslo"

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
})

export interface OsloTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export function osloTime(date: Date): OsloTime {
  const parts: Record<string, number> = {}
  for (const part of partsFormat.formatToParts(date))
    if (part.type !== "literal") parts[part.type] = Number(part.value)
  return parts as unknown as OsloTime
}

/** Minutes that Norwegian time is ahead of UTC at this instant: 60 or 120. */
export function osloOffsetMinutes(date: Date): number {
  const t = osloTime(date)
  const asUtc = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute)
  return Math.round((asUtc - date.getTime()) / 60000)
}

/** Minutes since Norwegian midnight. */
export function osloMinutes(date: Date): number {
  const t = osloTime(date)
  return t.hour * 60 + t.minute
}

/** "14:32" from minutes since midnight. */
export function clockText(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  timeZone: ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
})
/** "torsdag 12. november" */
export const dateText = (date: Date) => dateFormat.format(date)

const dayMonthFormat = new Intl.DateTimeFormat("nb-NO", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
})
/** "21. desember" */
export const dayMonthText = (date: Date) => dayMonthFormat.format(date)
