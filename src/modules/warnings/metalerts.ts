// Reads MET Norway's MetAlerts (farevarsler), through this template's own
// server, like the weather.
import { geoArea, geoCentroid } from "d3-geo"
import type { MultiPolygon, Polygon } from "geojson"

/** 1 is yellow, 2 orange, 3 red. */
export type Level = 1 | 2 | 3

export interface Warning {
  id: string
  /** What, in MET's Norwegian words: "Kraftig snøfokk", "Kuling". */
  event: string
  /** Where, as MET names it. */
  area: string
  level: Level
  from: string
  until: string
  domain: "land" | "coast"
  /** Middle of the area, for ordering north to south. */
  lat: number
  geometry: Polygon | MultiPolygon
}

export interface Feature {
  geometry: Polygon | MultiPolygon
  properties: {
    id: string
    event: string
    eventAwarenessName: string
    area: string
    awareness_level: string
    geographicDomain?: string | null
  }
  when: { interval: string[] }
}

const levels: Record<string, Level> = { yellow: 1, orange: 2, red: 3 }

/**
 * MET draws its polygons counter-clockwise, as GeoJSON asks, but d3 reads
 * that as everything on Earth except the area. Turn each such ring around.
 */
export function rewind<G extends Polygon | MultiPolygon>(geometry: G): G {
  const fix = (rings: number[][][]) => {
    const polygon: Polygon = { type: "Polygon", coordinates: rings }
    return geoArea(polygon) > 2 * Math.PI ? rings.map((ring) => [...ring].reverse()) : rings
  }
  if (geometry.type === "Polygon") return { ...geometry, coordinates: fix(geometry.coordinates) }
  return { ...geometry, coordinates: geometry.coordinates.map(fix) }
}

/**
 * Land warnings, and sea warnings for a stretch of coast, which MET names
 * from one place to another ("Lindesnes - Åna-Sira"). Warnings for the open
 * sea and the fishing banks far out (B2, Viking, Fisker) are for mariners
 * and are left out.
 */
export function isLandOrCoast(feature: Feature): boolean {
  const { geographicDomain, area } = feature.properties
  return geographicDomain === "land" || (geographicDomain === "marine" && area.includes(" - "))
}

export function parseAlerts(features: Feature[]): Warning[] {
  return features.filter(isLandOrCoast).map((feature) => {
    const p = feature.properties
    const geometry = rewind(feature.geometry)
    return {
      id: p.id,
      event: p.eventAwarenessName,
      area: p.area.replace(/\s+/g, " ").replace(/ - /g, " – ").trim(),
      level: levels[p.awareness_level.split(";")[1]?.trim()] ?? 1,
      from: feature.when.interval[0],
      until: feature.when.interval[1],
      domain: p.geographicDomain === "land" ? "land" : "coast",
      lat: geoCentroid(geometry)[1],
      geometry,
    }
  })
}

/**
 * The warnings that get a row, at most `limit`: the most serious first, land
 * before coast, sooner before later. Then put in order north to south.
 */
export function pick(warnings: Warning[], limit: number): Warning[] {
  const ranked = [...warnings].sort(
    (a, b) =>
      b.level - a.level ||
      (a.domain === b.domain ? 0 : a.domain === "land" ? -1 : 1) ||
      Date.parse(a.from) - Date.parse(b.from),
  )
  return ranked.slice(0, limit).sort((a, b) => b.lat - a.lat)
}

let last: { at: number; warnings: Promise<Warning[]> } | undefined

/** The warnings in force or announced now. The map and the rows share one fetch. */
export function loadAlerts(): Promise<Warning[]> {
  if (last && Date.now() - last.at < 60000) return last.warnings
  const warnings = (async () => {
    const response = await fetch("met/metalerts/2.0/current.json?lang=no")
    if (!response.ok) throw new Error(`MetAlerts: ${response.status}`)
    const body: { features: Feature[] } = await response.json()
    return parseAlerts(body.features)
  })()
  last = { at: Date.now(), warnings }
  warnings.catch(() => (last = undefined))
  return warnings
}

const weekday = new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", weekday: "short" })
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" })

/**
 * When, as it is read on screen: "til" the end of a warning that has begun,
 * "fra" the start of one that has not. The day is named only when it is not
 * today ("fre."), the time is Norwegian minutes since midnight.
 */
export function when(warning: Warning, now: Date): { word: "til" | "fra"; day?: string; at: Date } {
  const begun = Date.parse(warning.from) <= now.getTime()
  const at = new Date(begun ? warning.until : warning.from)
  const day = dayKey.format(at) === dayKey.format(now) ? undefined : weekday.format(at)
  return { word: begun ? "til" : "fra", day, at }
}
