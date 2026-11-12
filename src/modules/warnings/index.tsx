import { LevelMark, ModuleLabel, Notice, Row, Rows, TimeText, TwoLines } from "../../blocks"
import { CountryMap } from "../../blocks/CountryMap"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"
import { loadAlerts, parseAlerts, pick, when, type Feature, type Level, type Warning } from "./metalerts"

// Rows are two lines tall, so four fit under the label.
const ROWS = 4

const words: Record<Level, string> = { 1: "Gult", 2: "Oransje", 3: "Rødt" }

const exampleData = parseAlerts(example.features as Feature[])

function When({ warning, now }: { warning: Warning; now: Date }) {
  const { word, day, at } = when(warning, now)
  return (
    <>
      {word} {day && `${day} `}
      <TimeText minutes={osloMinutes(at)} />
    </>
  )
}

/** Danger warnings for land and coast as rows, north to south. */
export const warningRowsModule: InfoModule<Warning[]> = {
  id: "warning-rows",
  source: "MET Norge",
  refreshMinutes: 10,
  maxAgeMinutes: 60,
  load: loadAlerts,
  example: exampleData,
  View: ({ data, now }) => {
    if (data.length === 0)
      return (
        <>
          <ModuleLabel>Land og kyst</ModuleLabel>
          <Notice>Ingen farevarsler for land og kyst akkurat nå.</Notice>
        </>
      )
    const shown = pick(data, ROWS)
    return (
      <>
        <ModuleLabel>
          {shown.length < data.length ? `${shown.length} av ${data.length} varsler, ` : ""}fra nord til sør
        </ModuleLabel>
        <Rows>
          {shown.map((warning, i) => (
            <Row key={warning.id} index={i} columns="170px 1fr 180px" size="tall" gap={24}>
              <LevelMark level={warning.level}>{words[warning.level]}</LevelMark>
              <TwoLines main={warning.event} detail={warning.area} />
              {/* Not <Detail right>: its tabular figures widen the full stop in "fre." */}
              <span className="detail" style={{ textAlign: "right" }}>
                <When warning={warning} now={now} />
              </span>
            </Row>
          ))}
        </Rows>
      </>
    )
  },
}

/** Every warning area on the map, shaded by level. */
export const warningMapModule: InfoModule<Warning[]> = {
  id: "warning-map",
  source: "MET Norge",
  refreshMinutes: 10,
  maxAgeMinutes: 60,
  load: loadAlerts,
  example: exampleData,
  View: ({ data }) => <CountryMap areas={data.map(({ geometry, level }) => ({ geometry, level }))} />,
}
