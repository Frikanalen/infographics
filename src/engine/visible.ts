import { modulesOf, type InfoModule, type Loaded, type Page, type Problems } from "./types"

export interface Showing {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: InfoModule<any>
  data: unknown
  /** When the data was fetched, or undefined for modules that compute. */
  fetchedAt?: number
}
export interface Column {
  columns: number
  modules: Showing[]
}

/**
 * The modules on a page that have something true to show right now, column
 * by column. A module with no data, or with data past its maximum age,
 * leaves the page instead of showing a wrong number. So does a module whose
 * load gave null, which means it has nothing to show now. A column left
 * empty gives its width to the others. In demo mode everything is drawn
 * from its example data.
 */
export function showing(page: Page, loaded: Loaded, now: number, demo: boolean): Column[] {
  const out: Column[] = []
  for (const placement of page.modules) {
    const modules: Showing[] = []
    for (const module of modulesOf(placement)) {
      if (demo) {
        modules.push({ module, data: module.example })
        continue
      }
      const entry = loaded[module.id]
      // null is a module saying it has nothing to show now, such as out of season.
      if (!entry || entry.data === null) continue
      const limit = module.maxAgeMinutes
      if (limit !== undefined && now - entry.at > limit * 60000) continue
      modules.push({ module, data: entry.data, fetchedAt: limit === undefined ? undefined : entry.at })
    }
    if (modules.length) out.push({ columns: placement.columns, modules })
  }
  return out
}

/** The index of the next page after `from` that has anything to show, or -1. */
export function nextPage(pages: Page[], from: number, loaded: Loaded, now: number, demo: boolean): number {
  for (let step = 1; step <= pages.length; step++) {
    const index = (from + step + pages.length) % pages.length
    if (showing(pages[index], loaded, now, demo).length > 0) return index
  }
  return -1
}

export type ModuleState =
  | "example" // demo mode: drawn from example data
  | "ok"
  | "exampleOnly" // has no load yet, so it only appears in demo mode
  | "waiting" // first load has not come back
  | "failed" // never loaded, and the latest try failed
  | "stale" // loaded once, but the data is now too old to show
  | "nothing" // loaded fine and says there is nothing to show now

/** Where a module stands, for the dev panel. Mirrors the rules in `showing`. */
export function moduleState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: InfoModule<any>,
  loaded: Loaded,
  problems: Problems,
  now: number,
  demo: boolean,
): ModuleState {
  if (demo) return "example"
  if (!module.load) return "exampleOnly"
  const entry = loaded[module.id]
  if (!entry) return problems[module.id] ? "failed" : "waiting"
  if (entry.data === null) return "nothing"
  const limit = module.maxAgeMinutes
  if (limit !== undefined && now - entry.at > limit * 60000) return "stale"
  return "ok"
}
