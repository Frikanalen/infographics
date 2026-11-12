// The frame belongs to the template and is the same on every page: the brand
// stripe, the head with the clock, and the foot with the source and progress.
import type { ReactNode } from "react"
import { TimeText } from "../blocks"
import { dateText, osloMinutes } from "../engine/time"
import { useNow } from "../engine/useNow"

export function Frame(props: {
  on: boolean
  leaving: boolean
  title: string
  subtitle?: string
  foot: ReactNode
  children: ReactNode
}) {
  const now = useNow(1000)
  const classes = ["frame", props.on ? "" : "off", props.leaving ? "leaving" : ""].join(" ")
  return (
    <div className={classes}>
      <div className="stripe">
        <i />
        <i />
        <i />
      </div>
      <div className="head">
        <div className="words">
          <span className="title">{props.title}</span>
          {props.subtitle && <span className="subtitle">{props.subtitle}</span>}
        </div>
        <div>
          <span className="date">{dateText(now)}</span>
          <span className="clock">
            <TimeText minutes={osloMinutes(now)} />
          </span>
        </div>
      </div>
      {props.children}
      <div className="foot">{props.foot}</div>
    </div>
  )
}
