import { useEffect, useState } from "react"
import { modulesOf, type InfoModule, type Loaded, type Page } from "./types"

/**
 * Loads every module in the rundown once, then again on its own timer.
 * A load that fails keeps the previous data; `showing` decides when that
 * data has become too old to put on screen.
 */
export function useLoaded(pages: Page[], demo: boolean): Loaded {
  const [loaded, setLoaded] = useState<Loaded>({})

  useEffect(() => {
    if (demo) return
    const modules = new Map<string, InfoModule<unknown>>()
    for (const page of pages)
      for (const placement of page.modules)
        for (const module of modulesOf(placement)) modules.set(module.id, module)

    let stopped = false
    const timers: number[] = []
    for (const module of modules.values()) {
      const load = module.load
      if (!load) continue
      const run = async () => {
        try {
          const data = await load(new Date())
          if (!stopped) setLoaded((before) => ({ ...before, [module.id]: { data, at: Date.now() } }))
        } catch (error) {
          console.warn(`[${module.id}] could not load:`, error)
        }
      }
      void run()
      timers.push(window.setInterval(run, module.refreshMinutes * 60000))
    }
    return () => {
      stopped = true
      timers.forEach((timer) => window.clearInterval(timer))
    }
  }, [pages, demo])

  return loaded
}
