import { HeroNumber, ModuleLabel, Notice } from "../../blocks"
import { dayLength, daylight, nextSolstice } from "../../engine/sun"
import { dayMonthText } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import { places } from "../../places"

interface Turn {
  days: number
  kind: "vinter" | "sommer"
  date: string
}

/** How many days until the sun turns. Computed; needs no feed. */
export const solsticeModule: InfoModule<Turn> = {
  id: "solstice",
  source: "Beregnet fra solas bane",
  refreshMinutes: 30,
  load: (now) => {
    const turn = nextSolstice(now)
    return { days: turn.days, kind: turn.kind, date: turn.date.toISOString() }
  },
  example: { days: 39, kind: "vinter", date: "2026-12-21T12:00:00.000Z" },
  View: ({ data }) =>
    data.days === 0 ? (
      <>
        <ModuleLabel>Sola snur</ModuleLabel>
        <HeroNumber value="i dag" caption={`${data.kind}solverv`} />
      </>
    ) : (
      <>
        <ModuleLabel>Sola snur om</ModuleLabel>
        <HeroNumber
          value={data.days}
          caption={`${data.days === 1 ? "dag" : "dager"}, ved ${data.kind}solverv ${dayMonthText(new Date(data.date))}`}
        />
      </>
    ),
}

interface Change {
  north: number
  south: number
}

const minutesText = (n: number) => `${Math.abs(n)} ${Math.abs(n) === 1 ? "minutt" : "minutter"}`
const direction = (n: number) => (n < 0 ? "kortere" : "lengre")

/** How much the day has changed since yesterday, far north and far south. */
export const dayChangeModule: InfoModule<Change> = {
  id: "day-change",
  source: "Beregnet fra solas bane",
  refreshMinutes: 30,
  load: (now) => {
    const yesterday = new Date(now.getTime() - 86400000)
    const change = (place: { lat: number; lon: number }) =>
      Math.round(
        dayLength(daylight(now, place.lat, place.lon)) - dayLength(daylight(yesterday, place.lat, place.lon)),
      )
    return { north: change(places.tromso), south: change(places.kristiansand) }
  },
  example: { north: -13, south: -4 },
  View: ({ data }) => (
    <>
      <ModuleLabel>Siden i går</ModuleLabel>
      <Notice>
        {data.north === 0 && data.south === 0
          ? "Dagen er like lang som i går, både i Tromsø og i Kristiansand."
          : `Dagen er ${minutesText(data.north)} ${direction(data.north)} i Tromsø og ${minutesText(data.south)} ${direction(data.south)} i Kristiansand.`}
      </Notice>
    </>
  ),
}
