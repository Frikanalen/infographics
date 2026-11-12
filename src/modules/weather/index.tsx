import { Detail, PlaceName, Row, RowNumber, Rows } from "../../blocks"
import { CountryMap } from "../../blocks/CountryMap"
import type { InfoModule } from "../../engine/types"
import { places } from "../../places"
import example from "./example.json"
import { loadWeather, type Reading } from "./met"

const degrees = (t: number) => `${t < 0 ? "−" : ""}${Math.abs(t)}°`

// Eight places from north to south. Change the list here.
const shown: Reading["place"][] = ["vadso", "tromso", "bodo", "trondheim", "alesund", "bergen", "oslo", "kristiansand"]
const load = () => loadWeather(shown)

/** The weather now as rows, north to south. */
export const weatherRowsModule: InfoModule<Reading[]> = {
  id: "weather-rows",
  source: "MET Norge",
  refreshMinutes: 10,
  maxAgeMinutes: 90,
  load,
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
  load,
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
