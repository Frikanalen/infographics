// Reads departures from Entur's journey planner. Entur lets a web page call
// it directly, as long as the page says who it is in ET-Client-Name.

export interface Station {
  /** The name on screen. */
  name: string
  /** Entur's stop places for the station. Some stations have more than one. */
  ids: string[]
  lat: number
}

export interface Departure {
  station: string
  lat: number
  /** "F6", "RE10". Empty for some operators' trains. */
  line: string
  destination: string
  aimed: string
  expected: string
  realtime: boolean
  cancelled: boolean
}

/** Trains that go between towns. Local, airport and tourist trains are left out. */
const between = new Set(["regionalRail", "interregionalRail", "longDistance", "nightRail", "international"])

interface Call {
  aimedDepartureTime: string
  expectedDepartureTime: string
  realtime: boolean
  cancellation: boolean
  destinationDisplay: { frontText: string } | null
  serviceJourney: { transportSubmode: string; line: { publicCode: string | null } }
}
export interface Response {
  data: { stopPlaces: ({ id: string; estimatedCalls: Call[] } | null)[] }
}

/**
 * The next train between towns from each station, north to south. A station
 * with none in the time asked for is left out.
 */
export function nextDepartures(response: Response, stations: Station[]): Departure[] {
  const calls = new Map<string, Call[]>()
  for (const place of response.data.stopPlaces) if (place) calls.set(place.id, place.estimatedCalls)
  const out: Departure[] = []
  for (const station of stations) {
    const next = station.ids
      .flatMap((id) => calls.get(id) ?? [])
      .filter((call) => between.has(call.serviceJourney.transportSubmode))
      .sort((a, b) => Date.parse(a.aimedDepartureTime) - Date.parse(b.aimedDepartureTime))[0]
    if (!next) continue
    out.push({
      station: station.name,
      lat: station.lat,
      line: next.serviceJourney.line.publicCode ?? "",
      destination: next.destinationDisplay?.frontText ?? "",
      aimed: next.aimedDepartureTime,
      expected: next.expectedDepartureTime,
      realtime: next.realtime,
      cancelled: next.cancellation,
    })
  }
  return out.sort((a, b) => b.lat - a.lat)
}

/** Whole minutes late, by the expected time. Early counts as zero. */
export const minutesLate = (departure: Departure) =>
  Math.max(0, Math.round((Date.parse(departure.expected) - Date.parse(departure.aimed)) / 60000))

const query = `query ($ids: [String]!) {
  stopPlaces(ids: $ids) {
    id
    estimatedCalls(numberOfDepartures: 60, timeRange: 86400, arrivalDeparture: departures,
                   includeCancelledTrips: true, whiteListedModes: [rail]) {
      aimedDepartureTime expectedDepartureTime realtime cancellation
      destinationDisplay { frontText }
      serviceJourney { transportSubmode line { publicCode } }
    }
  }
}`

export async function loadDepartures(stations: Station[]): Promise<Departure[]> {
  const response = await fetch("https://api.entur.io/journey-planner/v3/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "ET-Client-Name": "frikanalen-infographics" },
    body: JSON.stringify({ query, variables: { ids: stations.flatMap((s) => s.ids) } }),
  })
  if (!response.ok) throw new Error(`Entur: ${response.status}`)
  const body = await response.json()
  if (body.errors) throw new Error(`Entur: ${JSON.stringify(body.errors).slice(0, 200)}`)
  return nextDepartures(body, stations)
}
