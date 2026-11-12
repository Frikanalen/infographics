import { expect, it } from "vitest"
import example from "./example.json"
import { minutesLate, nextDepartures, type Departure, type Response, type Station } from "./entur"

const stations: Station[] = [
  { name: "Kristiansand", ids: ["NSR:StopPlace:61608"], lat: 58.15 },
  { name: "Narvik", ids: ["NSR:StopPlace:58234", "NSR:StopPlace:62318"], lat: 68.44 },
  { name: "Trondheim S", ids: ["NSR:StopPlace:59977"], lat: 63.44 },
  { name: "Stavanger", ids: ["NSR:StopPlace:61291"], lat: 58.97 },
]

it("takes the next train between towns from each station, north to south", () => {
  const departures = nextDepartures(example as Response, stations)
  // Narvik had no trains that day, so it is left out.
  expect(departures.map((d) => d.station)).toEqual(["Trondheim S", "Stavanger", "Kristiansand"])
  // Trondheim's local trains are passed over for the night train.
  expect(departures[0]).toMatchObject({ line: "F6", destination: "Oslo S", aimed: expect.stringContaining("T23:17") })
  // Stavanger's L5 local trains are passed over too.
  expect(departures[1]).toMatchObject({ line: "F5", destination: "Kristiansand" })
})

it("counts minutes late from the expected time", () => {
  const [, , kristiansand] = nextDepartures(example as Response, stations)
  expect(kristiansand.realtime).toBe(true)
  expect(minutesLate(kristiansand)).toBe(70) // aimed 16:06, expected 17:15:32
  const early = { aimed: "2026-11-12T16:00:00+01:00", expected: "2026-11-12T15:59:00+01:00" } as Departure
  expect(minutesLate(early)).toBe(0)
})

it("passes cancellations on", () => {
  const response = structuredClone(example) as Response
  const call = response.data.stopPlaces.find((p) => p?.id === "NSR:StopPlace:61608")!.estimatedCalls[0]
  call.cancellation = true
  const departures = nextDepartures(response, stations)
  expect(departures.find((d) => d.station === "Kristiansand")?.cancelled).toBe(true)
})
