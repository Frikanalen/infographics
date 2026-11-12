import type { CSSProperties } from "react"
import { Detail, ModuleLabel, Notice, Row, Rows, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"
import { isOn, loadSchedule, parseSchedule, restOfDay, type Programme } from "./frikanalen"

const ROWS = 7

const weekday = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", weekday: "long" })

const ellipsis: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

/** What is on now, in amber, and what is left of today on Frikanalen. */
export const scheduleModule: InfoModule<Programme[]> = {
  id: "schedule",
  source: "Frikanalen",
  refreshMinutes: 10,
  maxAgeMinutes: 60,
  load: loadSchedule,
  example: parseSchedule(example.results),
  View: ({ data, now }) => {
    const { today, next } = restOfDay(data, now)
    if (!today.length)
      return (
        <>
          <ModuleLabel>Resten av dagen</ModuleLabel>
          <Notice>
            Ikke flere programmer i dag.
            {next && (
              <>
                {" "}
                Neste sending er {weekday.format(new Date(next.start))} klokka{" "}
                <TimeText minutes={osloMinutes(new Date(next.start))} />: {next.title}.
              </>
            )}
          </Notice>
        </>
      )
    const shown = today.slice(0, ROWS)
    return (
      <>
        <ModuleLabel>{shown.length < today.length ? `De neste ${shown.length}` : "Resten av dagen"}</ModuleLabel>
        <Rows>
          {shown.map((programme, i) => {
            const on = isOn(programme, now)
            return (
              <Row key={programme.start} index={i} columns="110px minmax(0, 1fr) 330px" gap={24}>
                {/* What is on now says so in words, in amber, where the start time would be. */}
                {on ? (
                  <span style={{ color: "var(--time)" }}>Nå</span>
                ) : (
                  <TimeText minutes={osloMinutes(new Date(programme.start))} />
                )}
                <span style={ellipsis}>{programme.title}</span>
                <Detail right>
                  <span style={{ ...ellipsis, display: "block", fontVariantNumeric: "normal" }}>{programme.by}</span>
                </Detail>
              </Row>
            )
          })}
        </Rows>
      </>
    )
  },
}
