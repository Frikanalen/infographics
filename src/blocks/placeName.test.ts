import { expect, it } from "vitest"
import { nameInTurn } from "./index"

it("keeps every place in step", () => {
  // turn:            Sami  Norwegian  third
  expect([0, 1, 2, 3].map((t) => nameInTurn(1, t))).toEqual([0, 0, 0, 0])
  expect([0, 1, 2, 3].map((t) => nameInTurn(2, t))).toEqual([0, 1, 1, 0])
  expect([0, 1, 2, 3].map((t) => nameInTurn(3, t))).toEqual([0, 1, 2, 0])
})
