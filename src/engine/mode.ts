// How the template was opened decides how it behaves, the same way as in
// on-air-graphics.
//
// Playout opens it with ?duration=<ms>: clean output, nothing on screen
// until CasparCG calls play(). Opened without a duration, by a person in a
// browser, it shows the dev panel and starts by itself.
//
//   ?duration=<ms>   on air: clean output, waits for play()
//   ?dev=false       clean output without a duration, starts by itself
//   ?dev=true        the dev panel even with a duration
//   ?demo=1          start with every module drawn from its example data
//   ?page=<id>       start held on one page

export interface Mode {
  /** Show the dev panel around the frame. */
  dev: boolean
  /** Start without waiting for play(). */
  autoplay: boolean
  demo: boolean
  page: string | null
}

export function modeFrom(search: string, viteDev: boolean): Mode {
  const query = new URLSearchParams(search)
  const hasDuration = query.has("duration")
  const dev = query.get("dev") === "true" || (query.get("dev") !== "false" && (viteDev || !hasDuration))
  return {
    dev,
    autoplay: !hasDuration,
    demo: query.get("demo") === "1",
    page: query.get("page"),
  }
}
