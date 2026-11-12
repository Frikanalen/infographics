import { expect, it } from "vitest"
import { hourly } from "./index"

it("averages quarter-hour prices into Norwegian hours", () => {
  const prices = [
    { NOK_per_kWh: 0.4, time_start: "2026-11-12T00:00:00+01:00" },
    { NOK_per_kWh: 0.6, time_start: "2026-11-12T00:15:00+01:00" },
    { NOK_per_kWh: 1.0, time_start: "2026-11-12T13:00:00Z" }, // 14:00 in Norway
  ]
  const hours = hourly(prices)
  expect(hours).toHaveLength(24)
  expect(hours[0]).toBe(50)
  expect(hours[14]).toBe(100)
})
