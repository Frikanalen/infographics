// The frame belongs to the template and is the same on every page: the brand
// stripe, the head with the clock, and the foot with the source and progress.
import { useEffect, useState, type ReactNode } from "react"
import { TimeText } from "../blocks"
import { dateText, osloMinutes } from "../engine/time"
import { useNow } from "../engine/useNow"

function useScale(): number {
  const measure = () => Math.min(window.innerWidth / 1280, window.innerHeight / 720)
  const [scale, setScale] = useState(measure)
  useEffect(() => {
    const onResize = () => setScale(measure())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return scale
}

export function Frame(props: {
  on: boolean
  leaving: boolean
  title: string
  subtitle?: string
  foot: ReactNode
  children: ReactNode
}) {
  const scale = useScale()
  const now = useNow(1000)
  const classes = ["frame", props.on ? "" : "off", props.leaving ? "leaving" : ""].join(" ")
  return (
    <div className={classes} style={{ transform: `scale(${scale})` }}>
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
