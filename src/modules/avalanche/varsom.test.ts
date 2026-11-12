import { expect, it } from "vitest"
import example from "./example.json"
import { parseRegions, pickRegions, type Region } from "./varsom"

it("reads today and tomorrow for the regions NVE has assessed, north to south", () => {
  const regions = parseRegions(example, "2026-03-10")!
  expect(regions.map((r) => r.name)).not.toContain("Finnmarksvidda") // not assessed
  expect(regions[0]).toEqual({ id: 3003, name: "Nordenskiöld Land", today: 2, tomorrow: 2 })
  expect(regions.find((r) => r.name === "Lofoten og Vesterålen")).toMatchObject({ today: 2, tomorrow: 1 })
  expect(regions.map((r) => r.id)).toEqual([...regions.map((r) => r.id)].sort())
})

it("gives null when nothing is assessed, as out of season", () => {
  const offSeason = example.map((r) => ({
    ...r,
    AvalancheWarningList: r.AvalancheWarningList.map((w) => ({ ...w, DangerLevel: "0" })),
  }))
  expect(parseRegions(offSeason, "2026-03-10")).toBeNull()
})

it("gives rows to the highest danger, then orders them north to south", () => {
  const r = (id: number, today: Region["today"], tomorrow?: Region["tomorrow"]): Region => ({
    id,
    name: `${id}`,
    today,
    tomorrow,
  })
  const picked = pickRegions([r(1, 2), r(2, 3), r(3, 2, 3), r(4, 4), r(5, 1)], 3)
  expect(picked.map((x) => x.id)).toEqual([2, 3, 4])
})
