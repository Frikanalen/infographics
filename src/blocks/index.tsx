// The building blocks. A module is put together from these, so that modules
// look like one family and rarely need CSS of their own.
import type { CSSProperties, ReactNode } from "react"
import { clockText } from "../engine/time"
import { useNow } from "../engine/useNow"

/** A label in spaced capitals, at the top of a module. */
export function ModuleLabel({ children }: { children: ReactNode }) {
  return <div className="label">{children}</div>
}

/** A list of rows. At most eight fit on a full page. */
export function Rows({ children }: { children: ReactNode }) {
  return <div className="rows">{children}</div>
}

/**
 * One ruled row. `columns` is a CSS grid template, for example "1fr 200px 110px".
 * `index` is the row's position, so rows arrive one after the other from the top.
 */
export function Row(props: {
  columns: string
  index: number
  size?: "compact" | "tall"
  gap?: number
  children: ReactNode
}) {
  const style = {
    gridTemplateColumns: props.columns,
    columnGap: props.gap,
    "--i": props.index,
  } as CSSProperties
  return (
    <div className={props.size ? `row ${props.size}` : "row"} style={style}>
      {props.children}
    </div>
  )
}

export const Detail = ({ children, right }: { children: ReactNode; right?: boolean }) => (
  <span className={right ? "detail right" : "detail"}>{children}</span>
)

/**
 * A time of day, from minutes since midnight. The digits keep a fixed width
 * so a running clock does not jiggle, while the colon stays narrow.
 */
export function TimeText({ minutes }: { minutes: number }) {
  const [hours, mins] = clockText(minutes).split(":")
  return (
    <span className="time">
      <span>{hours}</span>:<span>{mins}</span>
    </span>
  )
}

/** The value at the end of a row. */
export const RowNumber = ({ children, unit, large }: { children: ReactNode; unit?: string; large?: boolean }) => (
  <span className={large ? "number large right" : "number right"}>
    {children}
    {unit && <small>{unit}</small>}
  </span>
)

/**
 * A place name. Give several official names, for example
 * ["Kárášjohka", "Karasjok"], and they take turns in the same space.
 */
export function PlaceName({ names }: { names: string | string[] }) {
  const list = typeof names === "string" ? [names] : names
  const now = useNow(6000)
  const shown = Math.floor(now.getTime() / 6000) % list.length
  return (
    <span className="place">
      {list.map((name, i) => (
        <span key={name} className={i === shown ? "shown" : undefined}>
          {name}
        </span>
      ))}
    </span>
  )
}

/** The one figure a module exists to show. */
export function HeroNumber({ value, caption }: { value: ReactNode; caption?: ReactNode }) {
  return (
    <div>
      <div className="hero">{value}</div>
      {caption && <p className="hero-caption">{caption}</p>}
    </div>
  )
}

/** Two or three lines of plain text. */
export const Notice = ({ children }: { children: ReactNode }) => <p className="notice">{children}</p>

export type State = "open" | "caution" | "closed"

/** The shape that goes with a state: circle, triangle, square. Drawn in a 24x24 box. */
export function StateShape({ state }: { state: State }) {
  if (state === "open") return <circle className="mark-open" cx="12" cy="12" r="9" />
  if (state === "caution") return <path className="mark-caution" d="M12 2l11 20H1z" />
  return <rect className="mark-closed" x="3" y="3" width="18" height="18" />
}

/** Shape and word together. Colour is never the only thing that tells states apart. */
export function Status({ state, children }: { state: State; children: ReactNode }) {
  return (
    <span className="status">
      <svg viewBox="0 0 24 24">
        <StateShape state={state} />
      </svg>
      {children}
    </span>
  )
}

/** One bar per hour, all on the scale 0 to `max`. The current hour is amber. */
export function HourBars({ values, max, current }: { values: number[]; max: number; current: number }) {
  return (
    <div className="bars">
      {values.map((value, hour) => (
        <i
          key={hour}
          className={hour === current ? "now" : undefined}
          style={{ height: `${Math.max(5, (Math.max(0, value) / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

/** A 24-hour track with a lit span, and a line for now. Minutes since midnight. */
export function DayTrack({ from, to, now }: { from?: number; to?: number; now: number }) {
  const percent = (minutes: number) => `${(minutes / 1440) * 100}%`
  return (
    <div className="track">
      {from !== undefined && to !== undefined && (
        <i className="span" style={{ left: percent(from), width: percent(to - from) }} />
      )}
      <i className="now" style={{ left: percent(now) }} />
    </div>
  )
}

export const DayTrackAxis = () => (
  <div className="track-axis">
    <span>00</span>
    <span>06</span>
    <span>12</span>
    <span>18</span>
    <span>24</span>
  </div>
)
