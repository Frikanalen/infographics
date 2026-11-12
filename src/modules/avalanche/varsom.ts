// Reads NVE's avalanche warnings (the ones shown on varsom.no). The API
// allows a web page to call it directly, so it needs no pass-through.

export type DangerLevel = 1 | 2 | 3 | 4 | 5

export interface Region {
  /** NVE's region number. NVE numbers its regions from north to south. */
  id: number
  name: string
  today: DangerLevel
  tomorrow?: DangerLevel
}

interface Warning {
  DangerLevel: string
  ValidFrom: string
}
export interface Summary {
  Id: number
  Name: string
  AvalancheWarningList: Warning[]
}

/**
 * The regions NVE has assessed, today and tomorrow, north to south.
 * Danger level 0 means "not assessed": out of season, and in the simpler
 * B regions most of the time. Null when no region is assessed at all.
 */
export function parseRegions(summaries: Summary[], today: string): Region[] | null {
  const level = (warning?: Warning) => Number(warning?.DangerLevel ?? 0)
  const regions: Region[] = []
  for (const summary of summaries) {
    const list = summary.AvalancheWarningList
    const now = level(list.find((w) => w.ValidFrom.startsWith(today)))
    if (now < 1 || now > 5) continue
    const next = level(list.find((w) => w.ValidFrom.slice(0, 10) > today))
    regions.push({
      id: summary.Id,
      name: summary.Name,
      today: now as DangerLevel,
      tomorrow: next >= 1 && next <= 5 ? (next as DangerLevel) : undefined,
    })
  }
  return regions.length ? regions.sort((a, b) => a.id - b.id) : null
}

/** The regions that get a row, at most `limit`: the highest danger first, then north to south. */
export function pickRegions(regions: Region[], limit: number): Region[] {
  const ranked = [...regions].sort((a, b) => b.today - a.today || (b.tomorrow ?? 0) - (a.tomorrow ?? 0) || a.id - b.id)
  return ranked.slice(0, limit).sort((a, b) => a.id - b.id)
}

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })

export async function loadRegions(now: Date): Promise<Region[] | null> {
  const today = isoDay.format(now)
  const tomorrow = isoDay.format(new Date(now.getTime() + 86400000))
  const response = await fetch(
    `https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/RegionSummary/Simple/1/${today}/${tomorrow}`,
    { headers: { Accept: "application/json" } },
  )
  if (!response.ok) throw new Error(`Varsom: ${response.status}`)
  return parseRegions(await response.json(), today)
}
