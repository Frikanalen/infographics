// The frame is authored in real pixels at 1280x720. The stage scales it to
// whatever room it is given: the whole window on air, or the space beside
// the dev panel.
import { useEffect, useRef, useState, type ReactNode } from "react"

const WIDTH = 1280
const HEIGHT = 720

export function Stage(props: { centred?: boolean; children: ReactNode }) {
  const room = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, left: 0, top: 0 })

  useEffect(() => {
    const element = room.current
    if (!element) return
    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      const scale = Math.min(width / WIDTH, height / HEIGHT)
      setFit({
        scale,
        left: props.centred ? (width - WIDTH * scale) / 2 : 0,
        top: props.centred ? (height - HEIGHT * scale) / 2 : 0,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [props.centred])

  return (
    <div className="stage" ref={room}>
      <div
        className="stage-fit"
        style={{ transform: `translate(${fit.left}px, ${fit.top}px) scale(${fit.scale})` }}
      >
        {props.children}
      </div>
    </div>
  )
}
