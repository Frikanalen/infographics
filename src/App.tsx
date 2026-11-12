import { useCallback, useEffect, useMemo, useState } from "react"
import { Frame } from "./frame/Frame"
import { clockText, osloMinutes } from "./engine/time"
import type { Page } from "./engine/types"
import { useLoaded } from "./engine/useLoaded"
import { useNow } from "./engine/useNow"
import { nextPage, showing } from "./engine/visible"
import { rundown } from "./rundown"

const LEAVE_MS = 300

declare global {
  interface Window {
    play: () => void
    next: () => void
    update: (data: string) => void
  }
}

/**
 * Address options, for trying things out:
 *   ?demo=1       draw every module from its example data
 *   ?page=<id>    stay on one page
 */
const options = new URLSearchParams(window.location.search)
const demo = options.get("demo") === "1"
const held = options.get("page")

export function App() {
  const pages: Page[] = useMemo(() => (held ? rundown.filter((page) => page.id === held) : rundown), [])
  const loaded = useLoaded(pages, demo)
  const now = useNow(1000)
  const [on, setOn] = useState(true)
  const [index, setIndex] = useState(-1)
  const [turn, setTurn] = useState(0) // counts page changes, to restart animations
  const [leaving, setLeaving] = useState(false)

  const page = index >= 0 ? pages[index] : undefined
  const columns = page ? showing(page, loaded, now.getTime(), demo) : []
  const modules = columns.flatMap((column) => column.modules)
  const upcoming = nextPage(pages, Math.max(index, 0), loaded, now.getTime(), demo)

  const advance = useCallback(() => setLeaving(true), [])

  // Start on the first page that has something to show, and move on if the
  // current page loses all its modules.
  useEffect(() => {
    if (leaving) return
    if (index < 0 || modules.length === 0) {
      const first = nextPage(pages, index, loaded, Date.now(), demo)
      if (first >= 0 && first !== index) {
        setIndex(first)
        setTurn((t) => t + 1)
      }
    }
  }, [index, modules.length, leaving, pages, loaded])

  // Each page stays for its own number of seconds.
  useEffect(() => {
    if (!page || held) return
    const timer = window.setTimeout(advance, page.seconds * 1000)
    return () => window.clearTimeout(timer)
  }, [page, turn, advance])

  // Leaving: fade the old page out, then bring the next one in.
  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => {
      const next = nextPage(pages, index, loaded, Date.now(), demo)
      if (next >= 0) setIndex(next)
      setTurn((t) => t + 1)
      setLeaving(false)
    }, LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [leaving, index, pages, loaded])

  // CasparCG calls these. In a plain browser the template simply runs.
  useEffect(() => {
    window.play = () => setOn(true)
    window.stop = () => setOn(false)
    window.next = advance
    window.update = () => {}
    const onKey = (event: KeyboardEvent) => event.key === "ArrowRight" && advance()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advance])

  const sources = [...new Set(modules.map((m) => m.module.source))].join(" · ")
  const fetched = modules.flatMap((m) => (m.fetchedAt === undefined ? [] : [m.fetchedAt]))
  const oldest = fetched.length ? clockText(osloMinutes(new Date(Math.min(...fetched)))) : undefined
  const nextTitle = upcoming >= 0 && upcoming !== index ? pages[upcoming].title : undefined

  return (
    <Frame
      on={on}
      leaving={leaving}
      title={page && modules.length ? page.title : "Frikanalen"}
      subtitle={page && modules.length ? page.subtitle : "henter informasjon"}
      foot={
        <>
          {page && modules.length > 0 && !held && (
            <i key={turn} className="progress" style={{ animationDuration: `${page.seconds}s` }} />
          )}
          <span className={sources ? "source" : undefined}>
            {demo && <span className="demo">EKSEMPELDATA</span>}
            {sources && `Kilde: ${sources}`}
            {oldest && ` · oppdatert ${oldest}`}
          </span>
          {nextTitle && (
            <span>
              Neste: <b>{nextTitle}</b>
            </span>
          )}
        </>
      }
    >
      <div
        key={turn}
        className="surface"
        style={{ gridTemplateColumns: columns.map((c) => `minmax(0, ${c.columns}fr)`).join(" ") }}
      >
        {columns.map((column, i) => (
          <div className="column" key={i}>
            {column.modules.map(({ module, data }) => (
              <div className="module" key={module.id}>
                <module.View data={data} now={now} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )
}
