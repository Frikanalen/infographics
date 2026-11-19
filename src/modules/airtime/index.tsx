import { DayTrack, DayTrackAxis, Detail, ModuleLabel, Row, Rows, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import { loadGrants, type Grant } from "../schedule/frikanalen"
import example from "./example.json"

const ROWS = 8
const COLUMNS = "minmax(0, 380px) 1fr 170px"

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })

/** The windows that start today, in air order. */
export const today = (grants: Grant[], now: Date) =>
  grants
    .filter((grant) => dayKey.format(new Date(grant.starttime)) === dayKey.format(now))
    .sort((a, b) => Date.parse(a.starttime) - Date.parse(b.starttime))

/** Minutes since midnight where a window ends; one that runs past midnight ends the day. */
const endMinutes = (grant: Grant) =>
  dayKey.format(new Date(grant.endtime)) === dayKey.format(new Date(grant.starttime))
    ? osloMinutes(new Date(grant.endtime))
    : 1440

/**
 * Who holds the airtime today: one row for each window, lit on a track of
 * the day like the daylight page. The window we are in is amber.
 */
export const airtimeModule: InfoModule<Grant[]> = {
  id: "airtime",
  source: "Frikanalen",
  refreshMinutes: 10,
  maxAgeMinutes: 60,
  load: async (now) => {
    const grants = today(await loadGrants(), now)
    return grants.length ? grants : null
  },
  example: example as Grant[],
  steps: (data, now) => Math.max(1, Math.ceil(today(data, now).length / ROWS)),
  View: ({ data, now, step }) => {
    const grants = today(data, now)
    const pages = Math.ceil(grants.length / ROWS)
    const shown = grants.slice(step * ROWS, (step + 1) * ROWS)
    return (
      <>
        <ModuleLabel>
          Gjennom dagen{pages > 1 && ` · ${step + 1} av ${pages}`}
        </ModuleLabel>
        <Rows>
          {shown.map((grant, i) => {
            const from = osloMinutes(new Date(grant.starttime))
            const on = Date.parse(grant.starttime) <= now.getTime() && now.getTime() < Date.parse(grant.endtime)
            return (
              <Row key={grant.id} index={i} columns={COLUMNS} size="compact" gap={24}>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: on ? "var(--time)" : undefined,
                  }}
                >
                  {grant.organization.name}
                </span>
                <DayTrack from={from} to={endMinutes(grant)} now={osloMinutes(now)} />
                <Detail right>
                  <TimeText minutes={from} />–<TimeText minutes={endMinutes(grant)} />
                </Detail>
              </Row>
            )
          })}
        </Rows>
        <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 24 }}>
          <span />
          <DayTrackAxis />
        </div>
      </>
    )
  },
}
