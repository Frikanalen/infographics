// Where the sun is, from the NOAA solar equations. Good to a minute or two,
// which is what a row on television needs, and it needs no data feed.
import { osloOffsetMinutes, osloTime } from "./time"

const RAD = Math.PI / 180

function dayOfYear(year: number, month: number, day: number): number {
  return (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000
}

/** The sun's declination in radians, and the equation of time in minutes. */
export function solarPosition(year: number, month: number, day: number) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear(year, month, day) - 1)
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  const declination =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  return { declination, equationOfTime }
}

export type Daylight =
  | { state: "day"; rise: number; set: number } // minutes since Norwegian midnight
  | { state: "polarNight" }
  | { state: "midnightSun" }

/** Sunrise and sunset at a place, on the Norwegian calendar day of `date`. */
export function daylight(date: Date, lat: number, lon: number): Daylight {
  const { year, month, day } = osloTime(date)
  const { declination, equationOfTime } = solarPosition(year, month, day)
  // 90.833 degrees: the sun's upper edge on the horizon, with refraction.
  const cosHourAngle =
    Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(declination)) -
    Math.tan(lat * RAD) * Math.tan(declination)
  if (cosHourAngle > 1) return { state: "polarNight" }
  if (cosHourAngle < -1) return { state: "midnightSun" }
  const hourAngle = Math.acos(cosHourAngle) / RAD
  const offset = osloOffsetMinutes(new Date(Date.UTC(year, month - 1, day, 12)))
  return {
    state: "day",
    rise: 720 - 4 * (lon + hourAngle) - equationOfTime + offset,
    set: 720 - 4 * (lon - hourAngle) - equationOfTime + offset,
  }
}

/** Minutes of daylight: 0 in the polar night, 1440 under the midnight sun. */
export function dayLength(d: Daylight): number {
  if (d.state === "polarNight") return 0
  if (d.state === "midnightSun") return 1440
  return d.set - d.rise
}

/**
 * The instant of a solstice, from Meeus' "Astronomical Algorithms" (mean
 * solstice, table 27.B). Within a quarter of an hour of the true instant,
 * which settles the date on all but the rarest years.
 */
export function solstice(year: number, kind: "vinter" | "sommer"): Date {
  const y = (year - 2000) / 1000
  const julianDay =
    kind === "sommer"
      ? 2451716.56767 + 365241.62603 * y + 0.00325 * y ** 2 + 0.00888 * y ** 3 - 0.0003 * y ** 4
      : 2451900.05952 + 365242.74049 * y - 0.06223 * y ** 2 - 0.00823 * y ** 3 + 0.00032 * y ** 4
  return new Date((julianDay - 2440587.5) * 86400000)
}

/** The next day the sun turns, counted in Norwegian calendar days. */
export function nextSolstice(date: Date): { date: Date; days: number; kind: "vinter" | "sommer" } {
  const calendarDay = (d: Date) => {
    const t = osloTime(d)
    return Date.UTC(t.year, t.month - 1, t.day) / 86400000
  }
  const today = calendarDay(date)
  const year = osloTime(date).year
  for (const y of [year, year + 1]) {
    for (const kind of ["sommer", "vinter"] as const) {
      const at = solstice(y, kind)
      const days = calendarDay(at) - today
      if (days >= 0) return { date: at, days, kind }
    }
  }
  throw new Error("no solstice found")
}
