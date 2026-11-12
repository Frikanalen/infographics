import type { ComponentType } from "react"

/**
 * A module is one thing worth showing: a list, a map, a number.
 * It says where its data comes from and how to draw it, and nothing about
 * where on the page it sits. The rundown decides that.
 */
export interface InfoModule<T> {
  id: string
  /** Shown in the footer, after "Kilde:". */
  source: string
  /** Fetch or compute the data. Leave out until a live source exists: the
   *  module then only appears in demo mode, drawn from `example`. Give null
   *  when there is nothing to show now (out of season): the module leaves
   *  the page until a later load has something. */
  load?: (now: Date) => Promise<T | null> | T | null
  /** Minutes between loads. */
  refreshMinutes: number
  /** Data older than this is not shown. Leave out for modules that compute. */
  maxAgeMinutes?: number
  /** Sample data. Lets anyone see the module without a network. */
  example: T
  /** How many screens the data needs right now, for a list too long for
   *  one. The page stays its number of seconds on each, and the View is
   *  told which one to draw. Leave out for a module that fits on one. */
  steps?: (data: T, now: Date) => number
  View: ComponentType<{ data: T; now: Date; step: number }>
}

/** One module, or several stacked on top of each other, in a number of columns. */
export interface Placement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module?: InfoModule<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stack?: InfoModule<any>[]
  /** How many of the surface's twelve columns this gets. */
  columns: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modulesOf = (placement: Placement): InfoModule<any>[] =>
  placement.stack ?? (placement.module ? [placement.module] : [])

export interface Page {
  id: string
  title: string
  subtitle?: string
  /** How long the page stays on screen. */
  seconds: number
  /** Left to right across the surface. */
  modules: Placement[]
}

/** What has been loaded so far, by module id. */
export type Loaded = Record<string, { data: unknown; at: number } | undefined>

/** Why the latest load of a module failed, by module id. Shown in the dev panel. */
export type Problems = Record<string, string | undefined>
