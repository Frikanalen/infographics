import { Detail, ModuleLabel, Row, Rows, Status, TimeText } from "../../blocks"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import example from "./example.json"
import { loadDepartures, minutesLate, nextDepartures, type Departure, type Response, type Station } from "./entur"

// A spread of stations over the whole country. The list is drawn north to
// south whatever the order here. Narvik's trains run from a stop place of
// their own, so it has two.
const stations: Station[] = [
  { name: "Narvik", ids: ["NSR:StopPlace:58234", "NSR:StopPlace:62318"], lat: 68.44 },
  { name: "Bodø", ids: ["NSR:StopPlace:58952"], lat: 67.29 },
  { name: "Trondheim S", ids: ["NSR:StopPlace:59977"], lat: 63.44 },
  { name: "Åndalsnes", ids: ["NSR:StopPlace:59703"], lat: 62.57 },
  { name: "Bergen", ids: ["NSR:StopPlace:59983"], lat: 60.39 },
  { name: "Oslo S", ids: ["NSR:StopPlace:59872"], lat: 59.91 },
  { name: "Stavanger", ids: ["NSR:StopPlace:61291"], lat: 58.97 },
  { name: "Kristiansand", ids: ["NSR:StopPlace:61608"], lat: 58.15 },
]

/** Late by this many minutes or more counts as late on screen. */
const LATE = 3

const weekday = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", weekday: "short" })
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })

function When({ departure, now }: { departure: Departure; now: Date }) {
  const aimed = new Date(departure.aimed)
  const day = dayKey.format(aimed) === dayKey.format(now) ? "" : `${weekday.format(aimed)} `
  return (
    <span>
      {day && <span className="detail">{day}</span>}
      <TimeText minutes={osloMinutes(aimed)} />
    </span>
  )
}

function State({ departure }: { departure: Departure }) {
  if (departure.cancelled) return <Status state="closed">Innstilt</Status>
  // No real-time data yet, usually because the train has not set out: say so plainly.
  if (!departure.realtime) return <Detail>Planlagt</Detail>
  const late = minutesLate(departure)
  if (late >= LATE) return <Status state="caution">{late} min forsinket</Status>
  return <Status state="open">I rute</Status>
}

/** The next regional or long-distance train from each station, north to south. */
export const trainsModule: InfoModule<Departure[]> = {
  id: "trains",
  source: "Entur",
  refreshMinutes: 2,
  maxAgeMinutes: 10,
  load: () => loadDepartures(stations),
  example: nextDepartures(example as Response, stations),
  View: ({ data, now }) => (
    <>
      <ModuleLabel>Neste regiontog og fjerntog, fra nord til sør</ModuleLabel>
      <Rows>
        {data.map((departure, i) => (
          <Row key={departure.station} index={i} columns="230px 150px 92px 1fr 290px" gap={20}>
            <span>{departure.station}</span>
            <When departure={departure} now={now} />
            <span>{departure.line && <span className="chip">{departure.line}</span>}</span>
            <Detail>{departure.destination}</Detail>
            <State departure={departure} />
          </Row>
        ))}
      </Rows>
    </>
  ),
}
