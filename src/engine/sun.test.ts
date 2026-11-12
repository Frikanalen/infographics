import { describe, expect, it } from "vitest"
import { dayLength, daylight, nextSolstice } from "./sun"
import { clockText } from "./time"

const OSLO = [59.91, 10.75] as const
const TROMSO = [69.65, 18.96] as const

describe("daylight", () => {
  it("matches the almanac for Oslo at midsummer", () => {
    const d = daylight(new Date("2026-06-21T10:00:00Z"), ...OSLO)
    if (d.state !== "day") throw new Error(d.state)
    // Almanac: 03:54 and 22:44 Norwegian summer time.
    expect(Math.abs(d.rise - (3 * 60 + 54))).toBeLessThan(4)
    expect(Math.abs(d.set - (22 * 60 + 44))).toBeLessThan(4)
  })

  it("gives Oslo about eight hours of day in mid November", () => {
    const d = daylight(new Date("2026-11-12T10:00:00Z"), ...OSLO)
    if (d.state !== "day") throw new Error(d.state)
    // Worked by hand: solar noon 12:01, half a day of 234 minutes.
    expect(Math.abs(d.rise - (8 * 60 + 7))).toBeLessThan(5)
    expect(Math.abs(d.set - (15 * 60 + 55))).toBeLessThan(5)
  })

  it("knows the polar night and the midnight sun in Tromsø", () => {
    expect(daylight(new Date("2026-12-21T10:00:00Z"), ...TROMSO).state).toBe("polarNight")
    expect(daylight(new Date("2026-06-21T10:00:00Z"), ...TROMSO).state).toBe("midnightSun")
    expect(dayLength({ state: "polarNight" })).toBe(0)
  })
})

describe("nextSolstice", () => {
  it("finds the winter solstice from November", () => {
    // 2026: 21 December at 21:50 Norwegian time.
    const s = nextSolstice(new Date("2026-11-12T10:00:00Z"))
    expect(s.kind).toBe("vinter")
    expect(s.days).toBe(39)
    expect(Math.abs(s.date.getTime() - Date.parse("2026-12-21T20:50:00Z"))).toBeLessThan(20 * 60000)
  })
  it("says zero on the day itself", () => {
    expect(nextSolstice(new Date("2026-12-21T05:00:00Z")).days).toBe(0)
    expect(nextSolstice(new Date("2026-12-22T05:00:00Z")).kind).toBe("sommer")
  })
  it("finds the summer solstice from January", () => {
    expect(nextSolstice(new Date("2027-01-10T10:00:00Z")).kind).toBe("sommer")
  })
})

describe("clockText", () => {
  it("pads and wraps", () => {
    expect(clockText(8 * 60 + 3)).toBe("08:03")
    expect(clockText(1440)).toBe("00:00")
  })
})
