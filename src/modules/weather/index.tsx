import { Detail, PlaceName, Row, RowNumber, Rows } from "../../blocks"
import { CountryMap } from "../../blocks/CountryMap"
import type { InfoModule } from "../../engine/types"
import { places } from "../../places"
import example from "./example.json"

interface Reading {
  place: keyof typeof places
  sky: string
  wind: number
  temperature: number
}

const degrees = (t: number) => `${t < 0 ? "−" : ""}${Math.abs(t)}°`

// No `load` yet: MET Norway asks to be called from a server that identifies
// itself, so these two modules wait for the data service and only appear in
// demo mode until then.

/** The weather now as rows, north to south. */
export const weatherRowsModule: InfoModule<Reading[]> = {
  id: "weather-rows",
  source: "MET Norge",
  refreshMinutes: 10,
  maxAgeMinutes: 90,
  example: example as Reading[],
  View: ({ data }) => (
    <Rows>
      {data.map((reading, i) => (
        <Row key={reading.place} index={i} columns="1fr 200px 110px 110px">
          <PlaceName names={places[reading.place].names} />
          <Detail>{reading.sky}</Detail>
          <Detail right>{reading.wind} m/s</Detail>
          <RowNumber>{degrees(reading.temperature)}</RowNumber>
        </Row>
      ))}
    </Rows>
  ),
}

/** The same readings on the map. */
export const weatherMapModule: InfoModule<Reading[]> = {
  id: "weather-map",
  source: "MET Norge",
  refreshMinutes: 10,
  maxAgeMinutes: 90,
  example: example as Reading[],
  View: ({ data }) => (
    <CountryMap
      points={data.map((reading) => ({
        ...places[reading.place],
        text: degrees(reading.temperature),
        // Text goes over the sea in the north, where the land is narrow.
        side: places[reading.place].lat > 66 ? "left" : "right",
      }))}
    />
  ),
}
