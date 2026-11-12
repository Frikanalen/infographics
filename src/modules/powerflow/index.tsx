import { Detail, HeroNumber, ModuleLabel, Row, RowNumber, Rows, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"
import { direction, loadPowerFlow, net, parseCountry, parseFlows, type Direction, type FlowEntry, type Overview, type PowerFlow } from "./statnett"

const exampleData: PowerFlow = {
  measured: example.flow[0].MeasureDate,
  flows: parseFlows(example.flow as FlowEntry[]),
  country: parseCountry(example.overview as Overview),
}

const megawatts = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 })
const mw = (value: number) => megawatts.format(Math.round(Math.abs(value)))

const words: Record<Direction, string> = { export: "Eksport", import: "Import", none: "Ingen flyt" }

/**
 * Which way the power goes, as a shape between the word and the neighbour:
 * an arrow towards the neighbour for export, away from it for import, a short bar for none. The shape
 * and the word carry the direction; neither way is good or bad, so both are
 * drawn in the foreground colour.
 */
function DirectionMark({ way }: { way: Direction }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
      {way === "export" && <path d="M2 9h10V3l10 9-10 9v-6H2z" fill="var(--fg)" />}
      {way === "import" && <path d="M22 9H12V3L2 12l10 9v-6h10z" fill="var(--fg)" />}
      {way === "none" && <rect x="4" y="10" width="16" height="4" fill="var(--dim)" />}
    </svg>
  )
}

/** The flow on each link across the border, north to south. */
export const powerFlowRowsModule: InfoModule<PowerFlow> = {
  id: "power-flow-rows",
  source: "Statnett",
  refreshMinutes: 2,
  maxAgeMinutes: 10,
  load: (now) => loadPowerFlow(now),
  example: exampleData,
  View: ({ data }) => (
    <Rows>
      {data.flows.map((flow, i) => {
        const way = direction(flow.mw)
        return (
          <Row key={`${flow.norway}-${flow.abroad[0]}`} index={i} columns="116px 24px 1fr 180px" size="compact" gap={16}>
            <span className={way === "none" ? "detail" : undefined}>{words[way]}</span>
            <DirectionMark way={way} />
            <span style={{ whiteSpace: "nowrap" }}>
              {flow.neighbour} <Detail>{flow.detail}</Detail>
            </span>
            {way === "none" ? <span /> : <RowNumber unit="MW">{mw(flow.mw)}</RowNumber>}
          </Row>
        )
      })}
    </Rows>
  ),
}

/** Norway's net exchange now, the sum of the links, with production and consumption under it. */
export const powerNetModule: InfoModule<PowerFlow> = {
  id: "power-net",
  source: "Statnett",
  refreshMinutes: 2,
  maxAgeMinutes: 10,
  load: (now) => loadPowerFlow(now),
  example: exampleData,
  View: ({ data }) => {
    const total = net(data.flows)
    const way = direction(total)
    const country = data.country
    return (
      <>
        <ModuleLabel>{way === "none" ? "Norge, netto" : way === "export" ? "Norge eksporterer" : "Norge importerer"}</ModuleLabel>
        {way === "none" ? (
          <HeroNumber value="0" caption="MW, ingen netto flyt over grensen" />
        ) : (
          <HeroNumber value={mw(total)} caption="MW akkurat nå, alle forbindelser sammen" />
        )}
        {country && (
          <div style={{ marginTop: 48 }}>
            <ModuleLabel>
              Kvarteret fra <TimeText minutes={osloMinutes(new Date(country.measured))} />
            </ModuleLabel>
            <Rows>
              <Row columns="1fr auto" index={0} size="compact">
                <span>Produksjon</span>
                <RowNumber unit="MW">{mw(country.production)}</RowNumber>
              </Row>
              <Row columns="1fr auto" index={1} size="compact">
                <span>Forbruk</span>
                <RowNumber unit="MW">{mw(country.consumption)}</RowNumber>
              </Row>
            </Rows>
          </div>
        )}
      </>
    )
  },
}
