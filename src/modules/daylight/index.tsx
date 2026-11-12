import { DayTrack, DayTrackAxis, Detail, ModuleLabel, PlaceName, Row, Rows, TimeText } from "../../blocks"
import { daylight, type Daylight } from "../../engine/sun"
import { osloMinutes } from "../../engine/time"
import type { InfoModule } from "../../engine/types"
import { northToSouth, places, type Place } from "../../places"
import example from "./example.json"

type Data = { names: string | string[]; sun: Daylight }[]

const shown: Place[] = northToSouth([
  places.longyearbyen,
  places.karasjok,
  places.tromso,
  places.bodo,
  places.trondheim,
  places.bergen,
  places.oslo,
  places.kristiansand,
])

const COLUMNS = "220px 1fr 170px"

function Times({ sun }: { sun: Daylight }) {
  if (sun.state === "polarNight") return <>Mørketid</>
  if (sun.state === "midnightSun") return <>Midnattssol</>
  return (
    <>
      <TimeText minutes={sun.rise} />–<TimeText minutes={sun.set} />
    </>
  )
}

/** Sunrise and sunset today, from north to south. Computed; needs no feed. */
export const daylightModule: InfoModule<Data> = {
  id: "daylight",
  source: "Beregnet fra solas bane",
  refreshMinutes: 10,
  load: (now) => shown.map((place) => ({ names: place.names, sun: daylight(now, place.lat, place.lon) })),
  example: example as Data,
  View: ({ data, now }) => (
    <>
      <ModuleLabel>Fra nord til sør</ModuleLabel>
      <Rows>
        {data.map((row, i) => (
          <Row key={i} index={i} columns={COLUMNS} size="compact" gap={24}>
            <PlaceName names={row.names} />
            <DayTrack
              from={row.sun.state === "day" ? row.sun.rise : row.sun.state === "midnightSun" ? 0 : undefined}
              to={row.sun.state === "day" ? row.sun.set : row.sun.state === "midnightSun" ? 1440 : undefined}
              now={osloMinutes(now)}
            />
            <Detail right>
              <Times sun={row.sun} />
            </Detail>
          </Row>
        ))}
      </Rows>
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 24 }}>
        <span />
        <DayTrackAxis />
      </div>
    </>
  ),
}
