import { Detail, ModuleLabel, Notice, Row, Rows, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import { exampleSittings } from "./example"
import { loadSittings, screens, shownIn, type Sittings, type Slot } from "./stortinget"

const dayFormat = new Intl.DateTimeFormat("nb-NO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })
/** "torsdag 12. november" from "2026-11-12". */
const dayText = (date: string) => dayFormat.format(new Date(`${date}T12:00:00Z`))

const item = { display: "flex", flexDirection: "column", gap: 4, lineHeight: 1.2 } as const

/**
 * One meeting day at full width, with every agenda item in full. A long
 * agenda is spread over several screens, and the page stays on each.
 */
function day(slot: Slot): InfoModule<Sittings> {
  const agendaScreens = (data: Sittings, now: Date) =>
    screens(shownIn(slot, data, now, osloMinutes(now)).day?.agenda ?? [])
  return {
    id: `parliament-${slot}`,
    source: "Stortinget",
    refreshMinutes: 15,
    maxAgeMinutes: 180,
    load: loadSittings,
    example: exampleSittings(new Date()),
    steps: (data, now) => Math.max(1, agendaScreens(data, now).length),
    View: ({ data, now, step }) => {
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
        <>
          Møte klokka <TimeText minutes={osloMinutes(new Date(day.start))} />
          {votes.map((note) => ` · ${note.charAt(0).toLowerCase()}${note.slice(1)}`)}
        </>
      )
      if (!day.agenda)
        return (
          <>
            {heading}
            <Detail>{meeting}</Detail>
            <Notice>Dagsorden er ikke kunngjort ennå.</Notice>
          </>
        )
      const all = agendaScreens(data, now)
      const shown = all[Math.min(step, all.length - 1)] ?? []
      return (
        <>
          {heading}
          <Detail>
            {meeting}
            {all.length > 1 && ` · sak ${shown[0].number}–${shown.at(-1)!.number} av ${day.agenda.length}`}
          </Detail>
          <Rows key={step}>
            {shown.map((entry, i) => (
              <Row key={entry.number} index={i} size="roomy" columns="56px minmax(0, 1fr)" gap={12}>
                <Detail>{entry.number}</Detail>
                <span style={item}>
                  <span>{entry.text}</span>
                  {entry.from && <Detail>{entry.from}</Detail>}
                  {entry.remark && <Detail>{entry.remark}</Detail>}
                </span>
              </Row>
            ))}
          </Rows>
        </>
      )
    },
  }
}

/** The last meeting day until today's meeting starts, then today. */
export const parliamentFirstModule = day("first")
/** Today until today's meeting starts, then the next meeting day. */
export const parliamentSecondModule = day("second")
