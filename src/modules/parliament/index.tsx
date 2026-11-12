import { Detail, ModuleLabel, Notice, Row, Rows, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import { exampleSittings } from "./example"
import { loadSittings, shownIn, type Sittings, type Slot } from "./stortinget"

// Agenda lines are long, so each gets at least two lines, and four of them fit.
const ROWS = 4

const dayFormat = new Intl.DateTimeFormat("nb-NO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })
/** "torsdag 12. november" from "2026-11-12". */
const dayText = (date: string) => dayFormat.format(new Date(`${date}T12:00:00Z`))

/** Fewer items leave room for more of each: two lines each for four, up to four lines for one or two. */
const linesFor = (rows: number) => (rows >= 4 ? 2 : rows === 3 ? 3 : 4)
const clamped = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
    lineHeight: 1.2,
  }) as const

function half(slot: Slot): InfoModule<Sittings> {
  return {
    id: `parliament-${slot}`,
    source: "Stortinget",
    refreshMinutes: 15,
    maxAgeMinutes: 180,
    load: loadSittings,
    example: exampleSittings(new Date()),
    View: ({ data, now }) => {
      const { label, date, day } = shownIn(slot, data, now, osloMinutes(now))
      const heading = (
        <ModuleLabel>
          {label} · {dayText(date)}
        </ModuleLabel>
      )
      if (!day)
        return (
          <>
            {heading}
            <Notice>Stortinget har ikke møte denne dagen.</Notice>
          </>
        )
      const votes = day.notes.filter((note) => /^votering/i.test(note))
      const meeting = (
        <Detail>
          Møte klokka <TimeText minutes={osloMinutes(new Date(day.start))} />
          {votes.map((note) => ` · ${note.charAt(0).toLowerCase()}${note.slice(1)}`)}
        </Detail>
      )
      if (!day.agenda)
        return (
          <>
            {heading}
            {meeting}
            <Notice>Dagsorden er ikke kunngjort ennå.</Notice>
          </>
        )
      const shown = day.agenda.slice(0, ROWS)
      const more = day.agenda.length - shown.length
      return (
        <>
          {heading}
          {meeting}
          <Rows>
            {shown.map((item, i) => (
              <Row key={item.number} index={i} size="roomy" columns="44px minmax(0, 1fr)" gap={12}>
                <Detail>{item.number}</Detail>
                <span style={clamped(linesFor(shown.length))}>{item.text}</span>
              </Row>
            ))}
          </Rows>
          {more > 0 && <Detail>{more === 1 ? "og én sak til" : `og ${more} saker til`}</Detail>}
        </>
      )
    },
  }
}

/** Left half: the last meeting day until today's meeting starts, then today. */
export const parliamentFirstModule = half("first")
/** Right half: today until today's meeting starts, then the next meeting day. */
export const parliamentSecondModule = half("second")
