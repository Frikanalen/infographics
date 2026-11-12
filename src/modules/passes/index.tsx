import { Row, Rows, Status, type State } from "../../blocks"
import { CountryMap } from "../../blocks/CountryMap"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"

interface Pass {
  road: string
  name: string
  lat: number
  lon: number
  state: State
}

const words: Record<State, string> = { open: "Åpen", caution: "Kolonne", closed: "Stengt" }

// No `load` yet: Statens vegvesen's feed needs an account, so it has to be
// fetched by the data service. Until then these only appear in demo mode.

/** Mountain passes as rows, north to south. */
export const passRowsModule: InfoModule<Pass[]> = {
  id: "pass-rows",
  source: "Statens vegvesen",
  refreshMinutes: 5,
  maxAgeMinutes: 30,
  example: example as Pass[],
  View: ({ data }) => (
    <Rows>
      {data.map((pass, i) => (
        <Row key={pass.name} index={i} columns="92px 1fr 200px">
          <span className="chip">{pass.road}</span>
          <span>{pass.name}</span>
          <Status state={pass.state}>{words[pass.state]}</Status>
        </Row>
      ))}
    </Rows>
  ),
}

/** The same passes on the map, each drawn as the shape of its state. */
export const passMapModule: InfoModule<Pass[]> = {
  id: "pass-map",
  source: "Statens vegvesen",
  refreshMinutes: 5,
  maxAgeMinutes: 30,
  example: example as Pass[],
  View: ({ data }) => <CountryMap points={data} />,
}
