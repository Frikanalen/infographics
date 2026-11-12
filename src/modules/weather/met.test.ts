import { expect, it } from "vitest"
import { reading, skyText } from "./met"

it("puts MET's symbols into Norwegian words", () => {
  expect(skyText("partlycloudy_night")).toBe("Delvis skyet")
  expect(skyText("heavysnowshowers_polartwilight")).toBe("Kraftige snøbyger")
  expect(skyText("lightrainshowersandthunder_day")).toBe("Torden")
  expect(skyText("somethingnew")).toBe("")
  expect(skyText(undefined)).toBe("")
})

it("reads the weather now from a forecast", () => {
  const forecast = {
    properties: {
      timeseries: [
        {
          time: "2026-11-12T14:00:00Z",
          data: {
            instant: { details: { air_temperature: -3.6, wind_speed: 5.4 } },
            next_1_hours: { summary: { symbol_code: "snow" } },
          },
        },
        { time: "2026-11-12T15:00:00Z", data: { instant: { details: { air_temperature: 9, wind_speed: 9 } } } },
      ],
    },
  }
  const at = new Date("2026-11-12T14:59:00Z")
  expect(reading("tromso", forecast, at)).toEqual({ place: "tromso", sky: "Snø", wind: 5, temperature: -4 })
  // An hour later the cached forecast's first entry is out of date.
  expect(reading("tromso", forecast, new Date("2026-11-12T15:10:00Z")).temperature).toBe(9)
  // Before the forecast begins, use its first entry.
  expect(reading("tromso", forecast, new Date("2026-11-12T12:00:00Z")).temperature).toBe(-4)
})
