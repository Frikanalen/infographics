import { geoArea } from "d3-geo"
import { expect, it } from "vitest"
import example from "./example.json"
import { mergeStretches, parseAlerts, pick, rewind, when, type Feature, type Warning } from "./metalerts"

const features = example.features as Feature[]

it("keeps land and coast, and leaves out the open sea", () => {
  const warnings = parseAlerts(features)
  expect(warnings.map((w) => w.area)).toEqual([
    "Lindesnes – Åna-Sira",
    "Deler av fjellet i Sør-Norge",
    "Fedje – Stad",
    "Akershus, Oslo, Østfold, Vestfold, nedre Buskerud og sørlige Innlandet",
  ])
  expect(warnings[1]).toMatchObject({
    event: "Kraftig snøfokk",
    level: 1,
    domain: "land",
    from: "2026-11-14T08:00:00+00:00",
    until: "2026-11-15T08:00:00+00:00",
  })
  expect(warnings[0].domain).toBe("coast")
})

it("reads the level from MET's awareness level", () => {
  const [first] = features
  const as = (level: string) =>
    parseAlerts([{ ...first, properties: { ...first.properties, awareness_level: level } }])[0].level
  expect(as("2; yellow; Moderate")).toBe(1)
  expect(as("3; orange; Severe")).toBe(2)
  expect(as("4; red; Extreme")).toBe(3)
})

it("turns MET's polygons the way d3 draws them", () => {
  for (const feature of features) {
    expect(geoArea(feature.geometry)).toBeGreaterThan(2 * Math.PI) // as MET sends them
    expect(geoArea(rewind(feature.geometry))).toBeLessThan(0.01) // a small area of Earth
  }
})

const warning = (over: Partial<Warning>): Warning => ({
  id: over.area ?? "x",
  event: "Kuling",
  area: "x",
  level: 1,
  from: "2026-11-12T10:00:00Z",
  until: "2026-11-13T15:00:00Z",
  domain: "coast",
  lat: 60,
  geometry: { type: "Polygon", coordinates: [] },
  ...over,
})

it("joins coastal stretches that meet into one warning", () => {
  const square = (lat: number) => ({
    type: "Polygon" as const,
    coordinates: [[[5, lat], [5, lat + 1], [6, lat + 1], [6, lat], [5, lat]]],
  })
  const merged = mergeStretches([
    warning({ area: "Karmøy – Fedje", geometry: square(59), until: "2026-11-13T18:00:00Z" }),
    warning({ area: "Lindesnes – Åna-Sira", geometry: square(57), from: "2026-11-12T08:00:00Z" }),
    warning({ area: "Åna-Sira – Karmøy", geometry: square(58) }),
    warning({ area: "Fedje – Stad", level: 2 }), // more serious: stays by itself
    warning({ area: "Stad – Frøya", event: "Storm" }), // another event
    warning({ area: "Fedje – Stad", domain: "land" }), // only the coast is joined
  ])
  expect(merged.map((w) => `${w.area} ${w.event} ${w.level} ${w.domain}`).sort()).toEqual([
    "Fedje – Stad Kuling 1 land",
    "Fedje – Stad Kuling 2 coast",
    "Lindesnes – Fedje Kuling 1 coast",
    "Stad – Frøya Storm 1 coast",
  ])
  const long = merged.find((w) => w.area === "Lindesnes – Fedje")!
  expect(long.from).toBe("2026-11-12T08:00:00Z")
  expect(long.until).toBe("2026-11-13T18:00:00Z")
  expect(long.geometry.coordinates).toHaveLength(3)
  expect(long.lat).toBeGreaterThan(58)
  expect(long.lat).toBeLessThan(59)
})

it("gives rows to the most serious, then orders them north to south", () => {
  const list = [
    warning({ area: "south yellow", lat: 58 }),
    warning({ area: "north yellow land", lat: 69, domain: "land" }),
    warning({ area: "middle red", lat: 63, level: 3 }),
    warning({ area: "south orange", lat: 59, level: 2 }),
  ]
  expect(pick(list, 3).map((w) => w.area)).toEqual(["north yellow land", "middle red", "south orange"])
})

it("says until when, or from when if it has not begun", () => {
  const now = new Date("2026-11-12T15:00:00Z") // Thursday 16:00 in Norway
  const today = when(warning({ until: "2026-11-12T20:00:00Z" }), now)
  expect(today).toMatchObject({ word: "til", day: undefined })
  expect(when(warning({}), now)).toMatchObject({ word: "til", day: "fre." })
  expect(when(warning({ from: "2026-11-14T08:00:00Z" }), now)).toMatchObject({ word: "fra", day: "lør." })
})
