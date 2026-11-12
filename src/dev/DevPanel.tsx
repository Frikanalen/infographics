// The dev panel: what you get when the template is opened without
// ?duration. The frame stays at its real 1280x720 and is scaled into the
// space on the left; the panel's own type never touches the frame.
import type { ReactNode } from "react"
import { modulesOf, type Loaded, type Page, type Problems } from "../engine/types"
import { moduleState, type ModuleState } from "../engine/visible"
import "./dev.css"

const stateWords: Record<ModuleState, string> = {
  example: "eksempel",
  ok: "ok",
  exampleOnly: "kun eksempel",
  waiting: "venter",
  failed: "feilet",
  stale: "for gammelt",
  nothing: "ingenting nå",
}

export function DevPanel(props: {
  pages: Page[]
  current: string | undefined
  held: string | null
  demo: boolean
  on: boolean
  loaded: Loaded
  problems: Problems
  now: number
  onHold: (id: string | null) => void
  onNext: () => void
  onDemo: (demo: boolean) => void
  children: ReactNode
}) {
  const { pages, held, demo } = props
  return (
    <div className="dev">
      <div className="dev-stage">{props.children}</div>
      <aside className="dev-panel">
        <section>
          <h2>rotasjon</h2>
          <div className="dev-buttons">
            <button onClick={props.onNext} disabled={held !== null}>
              neste →
            </button>
            <button onClick={() => props.onHold(held ? null : (props.current ?? null))}>
              {held ? "slipp" : "hold"}
            </button>
          </div>
        </section>
        <section>
          <h2>data</h2>
          <div className="dev-buttons">
            <button className={demo ? undefined : "current"} onClick={() => props.onDemo(false)}>
              ekte
            </button>
            <button className={demo ? "current" : undefined} onClick={() => props.onDemo(true)}>
              eksempel
            </button>
          </div>
        </section>
        <section>
          <h2>casparcg</h2>
          <div className="dev-buttons">
            <button className={props.on ? "current" : undefined} onClick={() => window.play()}>
              PLAY
            </button>
            <button className={props.on ? undefined : "current"} onClick={() => window.stop()}>
              STOP
            </button>
          </div>
          <p>
            På lufta åpnes malen med <code>?duration=…</code>: da er den ren, og venter på play().
          </p>
        </section>
        <section>
          <h2>sider</h2>
          {pages.map((page) => (
            <div key={page.id} className="dev-page">
              <button
                className={page.id === props.current ? "current" : undefined}
                onClick={() => props.onHold(held === page.id ? null : page.id)}
                title="hold denne siden"
              >
                <span>{page.id === props.current ? "▶" : " "}</span>
                {page.id}
                {held === page.id && <em>holdt</em>}
              </button>
              {page.modules.flatMap(modulesOf).map((module) => {
                const state = moduleState(module, props.loaded, props.problems, props.now, demo)
                const problem = !demo && props.problems[module.id]
                return (
                  <div key={module.id} className={`dev-module ${state}`}>
                    <span>{module.id}</span>
                    <span>{stateWords[state]}</span>
                    {problem && <small>{problem}</small>}
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      </aside>
    </div>
  )
}
