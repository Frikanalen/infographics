import { describe, expect, it } from "vitest"
import type { InfoModule, Page } from "./types"
import { nextPage, showing, type Column } from "./visible"

const View = () => null
const fresh: InfoModule<number> = { id: "fresh", source: "A", refreshMinutes: 5, maxAgeMinutes: 30, example: 1, View }
const computed: InfoModule<number> = { id: "computed", source: "B", refreshMinutes: 5, example: 2, View }
const exampleOnly: InfoModule<number> = { id: "exampleOnly", source: "C", refreshMinutes: 5, example: 3, View }

const page = (id: string, ...modules: InfoModule<number>[]): Page => ({
  id,
  title: id,
  seconds: 30,
  modules: modules.map((module) => ({ module, columns: 6 })),
})
const MIN = 60000
const ids = (columns: Column[]) => columns.flatMap((c) => c.modules.map((m) => m.module.id))

describe("showing", () => {
  it("drops a module whose data is too old", () => {
    const loaded = { fresh: { data: 10, at: 0 }, computed: { data: 20, at: 0 } }
    const p = page("p", fresh, computed)
    expect(ids(showing(p, loaded, 29 * MIN, false))).toEqual(["fresh", "computed"])
    expect(ids(showing(p, loaded, 31 * MIN, false))).toEqual(["computed"])
  })
  it("never shows example data outside demo mode", () => {
    const p = page("p", exampleOnly)
    expect(showing(p, {}, 0, false)).toEqual([])
    expect(showing(p, {}, 0, true)[0].modules[0].data).toBe(3)
  })

  it("drops a module that has nothing to show now", () => {
    const p = page("p", fresh, computed)
    const loaded = { fresh: { data: null, at: 0 }, computed: { data: 20, at: 0 } }
    expect(ids(showing(p, loaded, 0, false))).toEqual(["computed"])
  })

  it("keeps a stack together and drops only its stale member", () => {
    const stacked: Page = { id: "s", title: "s", seconds: 30, modules: [{ stack: [fresh, computed], columns: 4 }] }
    const loaded = { fresh: { data: 10, at: 0 }, computed: { data: 20, at: 0 } }
    const columns = showing(stacked, loaded, 31 * MIN, false)
    expect(columns).toHaveLength(1)
    expect(ids(columns)).toEqual(["computed"])
  })
})

describe("nextPage", () => {
  it("skips pages with nothing to show", () => {
    const pages = [page("a", computed), page("b", exampleOnly), page("c", fresh)]
    const loaded = { computed: { data: 1, at: 0 }, fresh: { data: 1, at: 0 } }
    expect(nextPage(pages, 0, loaded, 0, false)).toBe(2)
    expect(nextPage(pages, 2, loaded, 0, false)).toBe(0)
    expect(nextPage(pages, 0, {}, 0, false)).toBe(-1)
  })
})
