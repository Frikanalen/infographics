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
          data: {
            instant: { details: { air_temperature: -3.6, wind_speed: 5.4 } },
            next_1_hours: { summary: { symbol_code: "snow" } },
          },
        },
        { data: { instant: { details: { air_temperature: 9, wind_speed: 9 } } } },
      ],
    },
  }
  expect(reading("tromso", forecast)).toEqual({ place: "tromso", sky: "Snø", wind: 5, temperature: -4 })
})
