import { modulesOf, type InfoModule, type Loaded, type Page } from "./types"

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
 * leaves the page instead of showing a wrong number, and a column left
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
      if (!entry) continue
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
