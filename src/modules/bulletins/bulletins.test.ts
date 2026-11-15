import { expect, it } from "vitest"
import { parseBulletins, screens } from "./bulletins"
import { example } from "./example"

it("shows every page of every bulletin in order, each for its own time", () => {
  expect(screens(example).map((s) => [s.bulletin.id, s.page, s.seconds])).toEqual([
    [1, 0, 12],
    [1, 1, 7],
    [2, 0, 9],
  ])
})

it("reads what the API returns", () => {
  const [bulletin] = parseBulletins([
    { id: 7, heading: " Hei ", template: "notice", pages: ["En", "To"], pageSeconds: [6.2, 3], text: "En\n\nTo" },
  ])
  expect(bulletin).toEqual({ id: 7, heading: "Hei", template: "notice", pages: ["En", "To"], pageSeconds: [6.2, 5] })
})

it("leaves out what cannot be shown", () => {
  expect(parseBulletins(undefined)).toEqual([])
  // A row without pages is not from this API, and an empty one says nothing.
  expect(parseBulletins([{ id: 1, heading: "Gammel", text: "Uten sider" }, { id: 2, heading: "", pages: [""] }, null])).toEqual(
    [],
  )
})

it("shows a bulletin that is only a heading", () => {
  expect(screens(parseBulletins([{ id: 3, heading: "Bare en overskrift", pages: [], pageSeconds: [] }]))).toMatchObject([
    { page: 0, text: "", seconds: 5 },
  ])
})
