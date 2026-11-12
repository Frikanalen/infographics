import { expect, it } from "vitest"
import example from "./example.json"
import { direction, figure, net, parseCountry, parseFlows, type FlowEntry, type Overview } from "./statnett"

const entries = example.flow as FlowEntry[]

it("takes the links across the border, north to south, and leaves links inside the Nordics out", () => {
  const flows = parseFlows(entries)
  expect(flows.map((f) => `${f.norway}-${f.abroad[0]}`)).toEqual([
    "NO4-FI",
    "NO4-SE1",
    "NO4-SE2",
    "NO3-SE2",
    "NO2-EN",
    "NO1-SE3",
    "NO2-NL",
    "NO2-DE",
    "NO2-DK1",
  ])
})

it("counts flow out of Norway as positive, whichever way round the feed names the link", () => {
  const flows = parseFlows(entries)
  const by = (detail: string) => flows.find((f) => f.detail === detail)!
  // NO2 -> EN is +1448.9 in the feed: export to Great Britain.
  expect(by("North Sea Link").mw).toBeCloseTo(1448.89, 1)
  // NO1 -> SE3 is -1362.9: Sweden sends power into Østlandet.
  expect(by("Østlandet").mw).toBeCloseTo(-1362.91, 1)
  expect(direction(by("North Sea Link").mw)).toBe("export")
  expect(direction(by("Østlandet").mw)).toBe("import")

  // The same link written from the other side gives the same answer.
  const turned: FlowEntry[] = [{ OutAreaElspotId: "SE3", InAreaElspotId: "NO1", Value: 1362.9125, MeasureDate: 0 }]
  expect(parseFlows(turned)[0].mw).toBeCloseTo(-1362.91, 1)
  const out: FlowEntry[] = [{ OutAreaElspotId: "DE", InAreaElspotId: "NO2", Value: -500, MeasureDate: 0 }]
  expect(parseFlows(out)[0].mw).toBe(500)
})

it("calls a link that carries next to nothing still", () => {
  expect(direction(0)).toBe("none")
  expect(direction(-9.9)).toBe("none")
  expect(direction(10)).toBe("export")
  expect(direction(-10)).toBe("import")
  const flows = parseFlows(entries)
  expect(direction(flows.find((f) => f.detail === "NorNed")!.mw)).toBe("none")
})

it("sums the links to Norway's net exchange", () => {
  expect(net(parseFlows(entries))).toBeCloseTo(1070.84, 1)
})

it("reads production and consumption, with spaces between thousands", () => {
  expect(figure("20 679")).toBe(20679)
  expect(figure("-300")).toBe(-300)
  expect(figure("-")).toBeUndefined()
  expect(figure("")).toBeUndefined()
  const country = parseCountry(example.overview as Overview)
  expect(country).toEqual({ production: 20679, consumption: 20379, measured: 1794498300000 })
  // The overview's own net exchange counts import as positive, the other way
  // from the flows: production minus consumption is +300, the feed says -300.
  expect(example.overview.NetExchangeData.find((c) => c.countryCode === "NO")!.value).toBe("-300")
})
