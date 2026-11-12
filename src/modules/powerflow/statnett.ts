// Reads Statnett's open operating data (driftsdata.statnett.no), through this
// template's own server: Statnett sends no CORS header, so a page cannot ask
// it directly (see nginx.conf and vite.config.ts).
//
// PhysicalFlowMap/GetFlow gives the measured flow on every link between price
// areas in the Nordic system, refreshed every few minutes. Each entry
// is one link, OutAreaElspotId to InAreaElspotId, in MW; a positive value
// flows from Out to In, a negative one the other way.
//
// ProductionConsumption/GetLatestDetailedOverview gives production,
// consumption and net exchange per country as quarter-hour figures, about
// half an hour behind. Its numbers are text with spaces between thousands.

export interface FlowEntry {
  OutAreaElspotId: string
  InAreaElspotId: string
  Value: number
  /** Milliseconds since 1970. */
  MeasureDate: number
}

interface OverviewCell {
  value: string
  countryCode: string | null
}

export interface Overview {
  /** Start of the quarter hour, in milliseconds since 1970. */
  MeasuredAt: number
  ProductionData: OverviewCell[]
  ConsumptionData: OverviewCell[]
}

/** One link across Norway's border. */
export interface Link {
  /** The Norwegian price area it leaves from, and the area across the border. */
  norway: string
  abroad: string[]
  neighbour: string
  /** The cable's name, or the part of Norway a land line runs from. */
  detail: string
  /** Where it leaves Norway, so the list and the map run north to south. */
  lat: number
  lon: number
}

// Every link across the border. The feed calls Great Britain "EN".
export const links: Link[] = [
  { norway: "NO4", abroad: ["FI"], neighbour: "Finland", detail: "Finnmark", lat: 69.6, lon: 28.6 },
  { norway: "NO4", abroad: ["SE1"], neighbour: "Sverige", detail: "Ofoten", lat: 68.4, lon: 18.1 },
  { norway: "NO4", abroad: ["SE2"], neighbour: "Sverige", detail: "Helgeland", lat: 65.9, lon: 14.4 },
  { norway: "NO3", abroad: ["SE2"], neighbour: "Sverige", detail: "Trøndelag", lat: 63.2, lon: 12.2 },
  { norway: "NO2", abroad: ["EN", "GB"], neighbour: "Storbritannia", detail: "North Sea Link", lat: 59.5, lon: 6.3 },
  { norway: "NO1", abroad: ["SE3"], neighbour: "Sverige", detail: "Østlandet", lat: 59.3, lon: 11.7 },
  { norway: "NO2", abroad: ["NL"], neighbour: "Nederland", detail: "NorNed", lat: 58.28, lon: 6.83 },
  { norway: "NO2", abroad: ["DE"], neighbour: "Tyskland", detail: "NordLink", lat: 58.25, lon: 6.6 },
  { norway: "NO2", abroad: ["DK1"], neighbour: "Danmark", detail: "Skagerrak", lat: 58.1, lon: 8.0 },
]

export interface Flow extends Link {
  /** MW out of Norway. Negative is import. */
  mw: number
}

export interface PowerFlow {
  /** When the flows were measured, in milliseconds since 1970. */
  measured: number
  /** North to south. A link the feed leaves out is left out here too. */
  flows: Flow[]
  /** Production and consumption in Norway, MW, for a quarter hour a while back. */
  country?: { production: number; consumption: number; measured: number }
}

/** Less than this either way, and the link counts as carrying nothing. */
export const STILL = 10

export type Direction = "export" | "import" | "none"

export function direction(mw: number): Direction {
  if (Math.abs(mw) < STILL) return "none"
  return mw > 0 ? "export" : "import"
}

/** Net MW out of Norway over all links. Negative is net import. */
export const net = (flows: Flow[]) => flows.reduce((sum, flow) => sum + flow.mw, 0)

/** The flow on each border link, turned so that positive is out of Norway. */
export function parseFlows(entries: FlowEntry[]): Flow[] {
  const flows: Flow[] = []
  for (const link of [...links].sort((a, b) => b.lat - a.lat)) {
    const entry = entries.find(
      (e) =>
        (e.OutAreaElspotId === link.norway && link.abroad.includes(e.InAreaElspotId)) ||
        (e.InAreaElspotId === link.norway && link.abroad.includes(e.OutAreaElspotId)),
    )
    if (!entry || !Number.isFinite(entry.Value)) continue
    flows.push({ ...link, mw: entry.OutAreaElspotId === link.norway ? entry.Value : -entry.Value })
  }
  return flows
}

/** "20 679" (any kind of space) to 20679. A dash or nothing gives undefined. */
export function figure(text: string | undefined): number | undefined {
  const digits = text?.replace(/[\s  ]/g, "")
  if (!digits || !/^-?\d+$/.test(digits)) return undefined
  return Number(digits)
}

/** Norway's production and consumption from the overview. */
export function parseCountry(overview: Overview): PowerFlow["country"] {
  const norway = (cells: OverviewCell[]) => figure(cells.find((cell) => cell.countryCode === "NO")?.value)
  const production = norway(overview.ProductionData)
  const consumption = norway(overview.ConsumptionData)
  if (production === undefined || consumption === undefined) return undefined
  return { production, consumption, measured: overview.MeasuredAt }
}

/** Flows measured longer ago than this are not passed on as now. */
const STALE_MINUTES = 15
/** Nor are production and consumption from longer ago than this. */
const COUNTRY_STALE_MINUTES = 90

let last: { at: number; data: Promise<PowerFlow> } | undefined

/** The flows now, and Norway's production and consumption if they can be had. Shared by the modules. */
export function loadPowerFlow(now: Date = new Date()): Promise<PowerFlow> {
  if (last && Date.now() - last.at < 60000) return last.data
  const data = (async () => {
    const [flowResponse, overview] = await Promise.all([
      fetch("statnett/PhysicalFlowMap/GetFlow"),
      fetch("statnett/ProductionConsumption/GetLatestDetailedOverview")
        .then((response) => (response.ok ? (response.json() as Promise<Overview>) : undefined))
        .catch(() => undefined),
    ])
    if (!flowResponse.ok) throw new Error(`Statnett: ${flowResponse.status}`)
    const entries = (await flowResponse.json()) as FlowEntry[]
    const flows = parseFlows(entries)
    if (flows.length === 0) throw new Error("Statnett: no border links in the feed")
    const measured = Math.max(...entries.map((e) => e.MeasureDate))
    if (now.getTime() - measured > STALE_MINUTES * 60000) throw new Error("Statnett: flows are stale")
    let country = overview && parseCountry(overview)
    if (country && now.getTime() - country.measured > COUNTRY_STALE_MINUTES * 60000) country = undefined
    return { measured, flows, country }
  })()
  last = { at: Date.now(), data }
  data.catch(() => (last = undefined))
  return data
}
