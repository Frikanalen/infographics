import { expect, it } from "vitest"
import { modeFrom } from "./mode"

it("is clean and waits for play() when playout gives a duration", () => {
  expect(modeFrom("?duration=3600000", false)).toMatchObject({ dev: false, autoplay: false })
})

it("shows the dev panel and starts by itself when opened bare", () => {
  expect(modeFrom("", false)).toMatchObject({ dev: true, autoplay: true, demo: false, page: null })
})

it("lets ?dev override either way", () => {
  expect(modeFrom("?dev=false", false)).toMatchObject({ dev: false, autoplay: true })
  expect(modeFrom("?duration=1000&dev=true", false)).toMatchObject({ dev: true, autoplay: false })
  expect(modeFrom("?dev=false", true).dev).toBe(false)
})

it("shows the dev panel under the Vite dev server even with a duration", () => {
  expect(modeFrom("?duration=1000", true).dev).toBe(true)
})

it("reads the starting page and example data", () => {
  expect(modeFrom("?demo=1&page=tog", false)).toMatchObject({ demo: true, page: "tog" })
})
