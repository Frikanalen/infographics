import { HourBars, Row, RowNumber, Rows } from "../../blocks"
import { osloTime } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"

interface Area {
  code: string
  name: string
  /** Øre per kWh for each hour of today, before taxes and grid rent. */
  hours: number[]
}

// The five price areas, north to south.
const areas = [
  { code: "NO4", name: "Nord-Norge" },
  { code: "NO3", name: "Midt-Norge" },
  { code: "NO5", name: "Vest-Norge" },
  { code: "NO1", name: "Østlandet" },
  { code: "NO2", name: "Sørlandet" },
]

interface Price {
  NOK_per_kWh: number
  time_start: string
}

/** Folds the feed's price periods (hours or quarters) into one average per hour. */
export function hourly(prices: Price[]): number[] {
  const sums: number[] = []
  const counts: number[] = []
  for (const price of prices) {
    const hour = osloTime(new Date(price.time_start)).hour
    sums[hour] = (sums[hour] ?? 0) + price.NOK_per_kWh * 100
    counts[hour] = (counts[hour] ?? 0) + 1
  }
  return Array.from({ length: 24 }, (_, hour) => (counts[hour] ? Math.round(sums[hour] / counts[hour]) : 0))
}

async function load(now: Date): Promise<Area[]> {
  const { year, month, day } = osloTime(now)
  const date = `${year}/${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  return Promise.all(
    areas.map(async (area) => {
      const response = await fetch(`https://www.hvakosterstrommen.no/api/v1/prices/${date}_${area.code}.json`)
      if (!response.ok) throw new Error(`${area.code}: ${response.status}`)
      return { ...area, hours: hourly(await response.json()) }
    }),
  )
}

/** The spot price now in all five price areas, with today's hours on one shared scale. */
export const electricityModule: InfoModule<Area[]> = {
  id: "electricity",
  source: "Nord Pool via hvakosterstrommen.no",
  refreshMinutes: 30,
  maxAgeMinutes: 180,
  load,
  example: example as Area[],
  View: ({ data, now }) => {
    const hour = osloTime(now).hour
    const max = Math.max(1, ...data.flatMap((area) => area.hours))
    return (
      <Rows>
        {data.map((area, i) => (
          <Row key={area.code} index={i} columns="240px 1fr 200px" size="tall" gap={32}>
            <span>
              <span className="code">{area.code}</span>
              {area.name}
            </span>
            <HourBars values={area.hours} max={max} current={hour} />
            <RowNumber large unit="øre">
              {area.hours[hour]}
            </RowNumber>
          </Row>
        ))}
      </Rows>
    )
  },
}
