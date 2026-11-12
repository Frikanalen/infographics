import { expect, it } from "vitest"
import example from "./example.json"
import { isOn, parseSchedule, restOfDay } from "./frikanalen"

const programmes = parseSchedule(example.results)

it("reads titles and organisations in order", () => {
  expect(programmes[0]).toEqual({
    start: "2026-11-12T08:00:00+01:00",
    end: "2026-11-12T08:28:02.368000+01:00",
    title: "Israel - Guds folk - del 4",
    by: "Agape Tromøy",
  })
  expect(programmes.map((p) => Date.parse(p.start))).toEqual(programmes.map((p) => Date.parse(p.start)).sort())
})

it("falls back to the item's own name when there is no video", () => {
  const live = {
    starttime: "2026-11-12T20:00:00+01:00",
    endtime: "2026-11-12T21:00:00+01:00",
    defaultName: "Direkte fra Stortinget",
    video: null,
  }
  expect(parseSchedule([live])[0]).toMatchObject({ title: "Direkte fra Stortinget", by: "" })
})

it("gives what is on now and the rest of today", () => {
  const now = new Date("2026-11-12T17:10:00+01:00")
  const { today, next } = restOfDay(programmes, now)
  expect(today.map((p) => p.start.slice(11, 16))).toEqual(["17:00", "18:00", "19:00"])
  expect(isOn(today[0], now)).toBe(true)
  expect(next).toBeUndefined()
})

it("names the first programme of tomorrow when today is over", () => {
  const { today, next } = restOfDay(programmes, new Date("2026-11-12T22:00:00+01:00"))
  expect(today).toEqual([])
  expect(next).toMatchObject({ start: "2026-11-13T08:00:00+01:00", title: "Israel - Guds folk - del 2" })
})
