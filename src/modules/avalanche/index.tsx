import type { CSSProperties } from "react"
import { ModuleLabel, Row, Rows } from "../../blocks"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"
import { loadRegions, parseRegions, pickRegions, type DangerLevel, type Region } from "./varsom"

// A label, a heading row and seven regions fill the page.
const ROWS = 7
const COLUMNS = "1fr 270px 270px"

// The European avalanche danger scale, as Varsom says it.
const words: Record<DangerLevel, string> = { 1: "Liten", 2: "Moderat", 3: "Betydelig", 4: "Stor", 5: "Meget stor" }

/** The number and the word. Only the two highest levels use a colour, the stop colour. */
function Danger({ level }: { level?: DangerLevel }) {
  if (!level) return <span className="detail">Ikke vurdert</span>
  const stop = level >= 4 ? ({ borderColor: "var(--stop)", color: "var(--stop)" } as CSSProperties) : undefined
  return (
    <span className="status">
      <span className="chip" style={stop}>
        {level}
      </span>
      {words[level]}
    </span>
  )
}

const exampleData = parseRegions(example, "2026-03-10")!

/** Avalanche danger today and tomorrow in the regions NVE assesses, north to south. */
export const avalancheModule: InfoModule<Region[]> = {
  id: "avalanche",
  source: "NVE og Varsom",
  refreshMinutes: 30,
  maxAgeMinutes: 180,
  load: loadRegions,
  example: exampleData,
  View: ({ data }) => {
    const shown = pickRegions(data, ROWS)
    return (
      <>
        <ModuleLabel>
          {shown.length < data.length ? `De ${shown.length} med høyest fare av ${data.length} områder, ` : ""}fra nord
          til sør
        </ModuleLabel>
        <div className="label" style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 24 }}>
          <span />
          <span>I dag</span>
          <span>I morgen</span>
        </div>
        <Rows>
          {shown.map((region, i) => (
            <Row key={region.id} index={i} columns={COLUMNS} gap={24}>
              <span>{region.name}</span>
              <Danger level={region.today} />
              <Danger level={region.tomorrow} />
            </Row>
          ))}
        </Rows>
      </>
    )
  },
}
