import { describe, expect, it } from "vitest"
import {
  around,
  meetingDays,
  parseAgenda,
  parseApiDate,
  parseNotes,
  sessionId,
  shortTitle,
  shownIn,
  type Sittings,
} from "./stortinget"

const at = (text: string) => new Date(text)
const api = (text: string) => `/Date(${Date.parse(text)}+0100)/`
const meeting = (day: string, more: object = {}) => ({
  id: -1,
  mote_dato_tid: api(`${day}T10:00:00+01:00`),
  mote_ting: 1,
  ikke_motedag_tekst: null,
  merknad: null,
  ...more,
})

describe("reading the Storting's plan", () => {
  it("reads the API's dates", () => {
    expect(parseApiDate("/Date(1794438000000+0100)/")).toBe(1794438000000)
    expect(new Date(parseApiDate("/Date(1794438000000+0100)/")).toISOString()).toBe("2026-11-11T23:00:00.000Z")
  })

  it("names the session, which turns on 1 October", () => {
    expect(sessionId(at("2026-11-12T12:00:00+01:00"))).toBe("2026-2027")
    expect(sessionId(at("2027-09-30T12:00:00+02:00"))).toBe("2026-2027")
    expect(sessionId(at("2027-10-01T00:30:00+02:00"))).toBe("2027-2028")
  })

  it("splits the notes of a day", () => {
    expect(parseNotes("-PACE. Strasbourg<BR>-Votering kl. 15.00<BR><BR>")).toEqual([
      "PACE. Strasbourg",
      "Votering kl. 15.00",
    ])
    expect(parseNotes(null)).toEqual([])
  })

  it("keeps days with a meeting, and joins two meetings on one day", () => {
    const days = meetingDays([
      meeting("2026-11-10", { id: 11680, merknad: "-Votering kl. 15.00" }),
      meeting("2026-11-10", { id: 11681, mote_dato_tid: api("2026-11-10T18:00:00+01:00") }),
      meeting("2026-11-13", { mote_ting: 0, merknad: "-EFTA/EØS. Brussel" }),
      meeting("2026-12-24", { mote_ting: 0, ikke_motedag_tekst: "Julaften" }),
      meeting("2026-11-12"),
    ])
    expect(days.map((day) => day.date)).toEqual(["2026-11-10", "2026-11-12"])
    expect(days[0].ids).toEqual([11680, 11681])
    expect(new Date(days[0].start).toISOString()).toBe("2026-11-10T09:00:00.000Z")
    expect(days[0].notes).toEqual(["Votering kl. 15.00"])
    expect(days[1].ids).toEqual([])
  })

  it("picks the meeting days around today", () => {
    const days = ["2026-11-05", "2026-11-10", "2026-11-12", "2026-11-17", "2026-11-18"].map((date) => ({ date }))
    expect(around(days, at("2026-11-12T08:00:00+01:00")).map((d) => d.date)).toEqual([
      "2026-11-10",
      "2026-11-12",
      "2026-11-17",
    ])
    expect(around(days, at("2026-11-14T08:00:00+01:00")).map((d) => d.date)).toEqual(["2026-11-12", "2026-11-17"])
  })
})

describe("agenda lines", () => {
  it("drops the preamble and keeps what the matter is about", () => {
    expect(
      shortTitle("Innstilling fra finanskomiteen om Endringer i statsbudsjettet 2026 under Finansdepartementet"),
    ).toBe("Endringer i statsbudsjettet 2026 under Finansdepartementet")
    expect(
      shortTitle(
        "Innstilling frå kontroll- og konstitusjonskomiteen om Grunnlovsforslag fra Kari Nordmann og Ola Nordmann om endring i § 49",
      ),
    ).toBe("Grunnlovsforslag om endring i § 49")
    expect(
      shortTitle("Innstilling fra helse- og omsorgskomiteen om Representantforslag fra stortingsrepresentantene A, B og C om bedre tannhelse"),
    ).toBe("Representantforslag om bedre tannhelse")
    expect(shortTitle("Muntlig spørretime")).toBe("Muntlig spørretime")
  })

  it("leaves out the formal last item", () => {
    expect(
      parseAgenda([
        { dagsordensak_nummer: 2, dagsordensak_tekst: "Ordinær spørretime" },
        { dagsordensak_nummer: 3, dagsordensak_tekst: "Referat" },
        { dagsordensak_nummer: 1, dagsordensak_tekst: "Muntlig spørretime" },
      ]),
    ).toEqual([
      { number: 1, text: "Muntlig spørretime" },
      { number: 2, text: "Ordinær spørretime" },
    ])
  })
})

describe("which days the page shows", () => {
  const day = (date: string, hour = 10) => ({
    date,
    start: Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00+01:00`),
    agenda: [],
    notes: [],
  })
  const week: Sittings = [day("2026-11-11"), day("2026-11-12"), day("2026-11-13")]
  const show = (sittings: Sittings, time: string) => {
    const now = at(time)
    const minutes = Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16))
    return (["first", "second"] as const).map((slot) => {
      const shown = shownIn(slot, sittings, now, minutes)
      return `${shown.label} ${shown.date}${shown.day ? "" : " (no meeting)"}`
    })
  }

  it("shows yesterday and today until the meeting starts", () => {
    expect(show(week, "2026-11-12T07:30:00+01:00")).toEqual(["I går 2026-11-11", "I dag 2026-11-12"])
    expect(show(week, "2026-11-12T09:59:00+01:00")).toEqual(["I går 2026-11-11", "I dag 2026-11-12"])
  })

  it("shows today and tomorrow from then on", () => {
    expect(show(week, "2026-11-12T10:00:00+01:00")).toEqual(["I dag 2026-11-12", "I morgen 2026-11-13"])
    expect(show(week, "2026-11-12T23:00:00+01:00")).toEqual(["I dag 2026-11-12", "I morgen 2026-11-13"])
  })

  it("follows a meeting that starts at noon", () => {
    const monday: Sittings = [day("2026-11-12"), day("2026-11-16", 12), day("2026-11-17")]
    expect(show(monday, "2026-11-16T11:00:00+01:00")).toEqual(["Forrige møte 2026-11-12", "I dag 2026-11-16"])
    expect(show(monday, "2026-11-16T12:00:00+01:00")).toEqual(["I dag 2026-11-16", "I morgen 2026-11-17"])
  })

  it("names the last and next meeting day when they are further off", () => {
    const weekend: Sittings = [day("2026-11-12"), day("2026-11-17")]
    expect(show(weekend, "2026-11-14T08:00:00+01:00")).toEqual([
      "Forrige møte 2026-11-12",
      "I dag 2026-11-14 (no meeting)",
    ])
    expect(show(weekend, "2026-11-14T15:00:00+01:00")).toEqual([
      "I dag 2026-11-14 (no meeting)",
      "Neste møte 2026-11-17",
    ])
  })
})
