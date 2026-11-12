import { useCallback, useEffect, useState } from "react"
import { DevPanel } from "./dev/DevPanel"
import { modeFrom } from "./engine/mode"
import { Frame } from "./frame/Frame"
import { Stage } from "./frame/Stage"
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

const mode = modeFrom(window.location.search, import.meta.env.DEV)

export function App() {
  const pages: Page[] = rundown
  const [demo, setDemo] = useState(mode.demo)
  const [held, setHeld] = useState(mode.page) // the id of a page to stay on
  const { loaded, problems } = useLoaded(pages, demo)
  const now = useNow(1000)
  // On air (?duration) the template stays dark until CasparCG calls play().
  const [on, setOn] = useState(mode.autoplay)
  const [index, setIndex] = useState(-1)
  const [turn, setTurn] = useState(0) // counts page changes, to restart animations
  const [leaving, setLeaving] = useState(false)
  const [stepAt, setStepAt] = useState({ turn: 0, step: 0 }) // which screen of a page with several

  const page = index >= 0 ? pages[index] : undefined
  const columns = page ? showing(page, loaded, now.getTime(), demo) : []
  const modules = columns.flatMap((column) => column.modules)
  // A module with a list too long for one screen asks for several; the page
  // stays its seconds on each.
  const steps = Math.max(1, ...modules.map((m) => m.module.steps?.(m.data, now) ?? 1))
  const step = stepAt.turn === turn ? Math.min(stepAt.step, steps - 1) : 0
  const upcoming = nextPage(pages, Math.max(index, 0), loaded, now.getTime(), demo)

  const advance = useCallback(() => setLeaving(true), [])

  // Start on the first page that has something to show, and move on if the
  // current page loses all its modules.
  // A held page stays even when it has nothing to show.
  useEffect(() => {
    if (leaving) return
    if (held) {
      const wanted = pages.findIndex((page) => page.id === held)
      if (wanted >= 0 && wanted !== index) {
        setIndex(wanted)
        setTurn((t) => t + 1)
      }
      if (wanted >= 0) return
    }
    if (index < 0 || modules.length === 0) {
      const first = nextPage(pages, index, loaded, Date.now(), demo)
      if (first >= 0 && first !== index) {
        setIndex(first)
        setTurn((t) => t + 1)
      }
    }
  }, [index, modules.length, leaving, pages, loaded, demo, held])

  // Each page stays for its own number of seconds on each of its screens.
  // A held page keeps going round its screens.
  useEffect(() => {
    if (!page) return
    const last = step + 1 >= steps
    if (held && steps === 1) return
    const timer = window.setTimeout(() => {
      if (last && !held) advance()
      else setStepAt({ turn, step: last ? 0 : step + 1 })
    }, page.seconds * 1000)
    return () => window.clearTimeout(timer)
  }, [page, turn, step, steps, advance, held])

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
  }, [leaving, index, pages, loaded, demo])

  // CasparCG calls these.
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

  const frame = (
    <Frame
      on={on}
      leaving={leaving}
      title={page && modules.length ? page.title : "Frikanalen"}
      subtitle={page && modules.length ? page.subtitle : "henter informasjon"}
      foot={
        <>
          {page && modules.length > 0 && (!held || steps > 1) && (
            <i key={`${turn}-${step}`} className="progress" style={{ animationDuration: `${page.seconds}s` }} />
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
                <module.View data={data} now={now} step={step} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )

  if (!mode.dev) return <Stage>{frame}</Stage>
  return (
    <DevPanel
      pages={pages}
      current={page?.id}
      held={held}
      demo={demo}
      on={on}
      loaded={loaded}
      problems={problems}
      now={now.getTime()}
      onHold={setHeld}
      onNext={advance}
      onDemo={setDemo}
    >
      <Stage centred>{frame}</Stage>
    </DevPanel>
  )
}
