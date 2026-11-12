// Reads MET Norway's Locationforecast, through this template's own server
// (see nginx.conf and vite.config.ts for why).
import { places } from "../../places"

export interface Reading {
  place: keyof typeof places
  sky: string
  wind: number
  temperature: number
}

const skies: Record<string, string> = {
  clearsky: "Klarvær",
  fair: "Lettskyet",
  partlycloudy: "Delvis skyet",
  cloudy: "Skyet",
  fog: "Tåke",
  lightrain: "Lett regn",
  rain: "Regn",
  heavyrain: "Kraftig regn",
  lightrainshowers: "Lette regnbyger",
  rainshowers: "Regnbyger",
  heavyrainshowers: "Kraftige regnbyger",
  lightsleet: "Lett sludd",
  sleet: "Sludd",
  heavysleet: "Kraftig sludd",
  lightsleetshowers: "Sluddbyger",
  sleetshowers: "Sluddbyger",
  heavysleetshowers: "Sluddbyger",
  lightsnow: "Lett snø",
  snow: "Snø",
  heavysnow: "Kraftig snø",
  lightsnowshowers: "Lette snøbyger",
  snowshowers: "Snøbyger",
  heavysnowshowers: "Kraftige snøbyger",
}

/** MET's symbol code, such as "lightrainshowers_night", in Norwegian words. */
export function skyText(symbol: string | undefined): string {
  if (!symbol) return ""
  const code = symbol.split("_")[0]
  if (code.includes("thunder")) return "Torden"
  return skies[code] ?? ""
}

interface Forecast {
  properties: {
    timeseries: {
      data: {
        instant: { details: { air_temperature: number; wind_speed: number } }
        next_1_hours?: { summary: { symbol_code: string } }
        next_6_hours?: { summary: { symbol_code: string } }
      }
    }[]
  }
}

/** The first entry in a forecast is the weather now. */
export function reading(place: Reading["place"], forecast: Forecast): Reading {
  const now = forecast.properties.timeseries[0].data
  return {
    place,
    sky: skyText((now.next_1_hours ?? now.next_6_hours)?.summary.symbol_code),
    wind: Math.round(now.instant.details.wind_speed),
    temperature: Math.round(now.instant.details.air_temperature),
  }
}

let last: { at: number; readings: Promise<Reading[]> } | undefined

/** The weather now at each place. The map and the rows share one fetch. */
export function loadWeather(shown: Reading["place"][]): Promise<Reading[]> {
  if (last && Date.now() - last.at < 60000) return last.readings
  const readings = Promise.all(
    shown.map(async (place) => {
      const { lat, lon } = places[place]
      const response = await fetch(`met/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`)
      if (!response.ok) throw new Error(`MET ${place}: ${response.status}`)
      return reading(place, await response.json())
    }),
  )
  last = { at: Date.now(), readings }
  readings.catch(() => (last = undefined))
  return readings
}
