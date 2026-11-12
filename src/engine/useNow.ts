import { useEffect, useState } from "react"

/** The current time, updated every `everyMs`, on the boundary. */
export function useNow(everyMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: number
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(tick, everyMs - (Date.now() % everyMs) + 5)
    }
    timer = window.setTimeout(tick, everyMs - (Date.now() % everyMs) + 5)
    return () => window.clearTimeout(timer)
  }, [everyMs])
  return now
}
