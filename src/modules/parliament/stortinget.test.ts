import { describe, expect, it } from "vitest"
import {
  around,
  meetingDays,
  parseAgenda,
  parseApiDate,
  parseNotes,
  sessionId,
  parseItemText,
  plainText,
  resultOf,
  summaryOf,
  votesOn,
  type RawVote,
  screens,
  itemHeight,
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
  it("puts the matter first and keeps where it comes from", () => {
    expect(
      parseItemText("Innstilling fra finanskomiteen om Endringer i statsbudsjettet 2026 under Finansdepartementet"),
    ).toEqual({
      text: "Endringer i statsbudsjettet 2026 under Finansdepartementet",
      from: "Innstilling fra finanskomiteen",
    })
    // Real lines from the week of 10 November 2026.
    expect(
      parseItemText(
        "Innstilling fra kommunal- og forvaltningskomiteen om Representantforslag fra stortingsrepresentantene Erlend Wiborg, Rune Midtun, Helge André Njåstad og Bjørn Larsen om en tydelig og forpliktende integreringskontrakt",
      ),
    ).toEqual({
      text: "Representantforslag om en tydelig og forpliktende integreringskontrakt",
      from: "Innstilling fra kommunal- og forvaltningskomiteen, forslag fra Erlend Wiborg, Rune Midtun, Helge André Njåstad og Bjørn Larsen",
    })
    expect(
      parseItemText(
        "Innstilling fra familie- og kulturkomiteen om Representantforslag frå stortingsrepresentantane Erling Sande, Kjersti Toppe og Ole Herman Sveian om å be regjeringa greie ut alternativet «Ny framtid for Nationaltheatret» grundigare",
      ),
    ).toEqual({
      text: "Representantforslag om å be regjeringa greie ut alternativet «Ny framtid for Nationaltheatret» grundigare",
      from: "Innstilling fra familie- og kulturkomiteen, forslag fra Erling Sande, Kjersti Toppe og Ole Herman Sveian",
    })
    expect(parseItemText("Muntlig spørretime")).toEqual({ text: "Muntlig spørretime" })
  })

  it("keeps the remark on the lines after the title", () => {
    expect(
      parseItemText(
        "Debatt om kultur- og likestillingsministerens redegjørelse om mediepolitikk og ytringsfrihet\r\n(Redegjørelsen holdt i Stortingets møte 10. november 2026)",
      ),
    ).toEqual({
      text: "Debatt om kultur- og likestillingsministerens redegjørelse om mediepolitikk og ytringsfrihet",
      remark: "Redegjørelsen holdt i Stortingets møte 10. november 2026",
    })
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

  it("splits a long agenda into screens of whole items, in order", () => {
    const long = "Representantforslag om en tydelig og forpliktende integreringskontrakt for alle nyankomne"
    const agenda = Array.from({ length: 7 }, (_, i) => ({
      number: i + 1,
      text: long,
      from: "Innstilling fra kommunal- og forvaltningskomiteen, forslag fra fire representanter",
    }))
    const split = screens(agenda)
    expect(split.length).toBeGreaterThan(1)
    expect(split.flat()).toEqual(agenda)
    for (const screen of split) expect(screen.reduce((sum, item) => sum + itemHeight(item), 0)).toBeLessThanOrEqual(440)
    expect(screens([{ number: 1, text: "Muntlig spørretime" }])).toHaveLength(1)
    expect(screens([])).toEqual([])
  })
})

describe("how a matter went", () => {
  // Real rows from 10 and 12 November 2026, without the fields that are not read.
  const carried: RawVote = {
    votering_id: 28622,
    alternativ_votering_id: 28623,
    mote_kart_nummer: 13,
    dagsorden_sak_nummer: 2,
    vedtatt: true,
    antall_for: 71,
    antall_mot: 29,
    votering_resultat_type_tekst: null,
  }
  const mirror: RawVote = { ...carried, votering_id: 28623, alternativ_votering_id: 28622, vedtatt: false, antall_for: 29, antall_mot: 71 }
  const unanimous: RawVote = {
    votering_id: 28626,
    alternativ_votering_id: -1,
    mote_kart_nummer: 15,
    dagsorden_sak_nummer: 1,
    vedtatt: true,
    antall_for: -1,
    antall_mot: -1,
    votering_resultat_type_tekst: "Enstemmig vedtatt",
  }
  const recommendation = {
    forslag_betegnelse: "Komiteens tilråding ",
    forslag_tekst:
      "<div class='strtngt_vedtaks'>\r\n  <p class='strtngt_a type_innrykk'>\r\n    Dokument 8:275 S (2025–2026) – Representantforslag\nfra stortingsrepresentantene Erlend Wiborg, Rune Midtun, Helge André\nNjåstad og Bjørn Larsen om en tydelig og forpliktende integreringskontrakt\n– vedtas ikke.\r\n  </p>\r\n</div>",
  }

  it("keeps the votes of this meeting and item, and one row of an alternative vote", () => {
    expect(votesOn([carried, mirror, unanimous], 13, 2)).toEqual([carried])
    expect(votesOn([carried, mirror, unanimous], 15, 1)).toEqual([unanimous])
    expect(votesOn([carried, mirror], 14, 2)).toEqual([])
  })

  it("reads the API's HTML as plain text", () => {
    expect(plainText(recommendation.forslag_tekst)).toBe(
      "Dokument 8:275 S (2025–2026) – Representantforslag fra stortingsrepresentantene Erlend Wiborg, Rune Midtun, Helge André Njåstad og Bjørn Larsen om en tydelig og forpliktende integreringskontrakt – vedtas ikke.",
    )
    expect(plainText(null)).toBe("")
  })

  it("says a proposal was turned down when the recommendation to do so carried", () => {
    expect(resultOf(carried, recommendation)).toEqual({ line: "Ikke vedtatt, med 71 mot 29 stemmer" })
  })

  it("says what carried, in the Storting's words, otherwise", () => {
    expect(
      resultOf(carried, {
        forslag_betegnelse: "Komiteens tilråding ",
        forslag_tekst: "<p>Stortinget ber regjeringen legge fram en plan for fergefri kyststamvei.</p>",
      }),
    ).toEqual({
      line: "Komiteens tilråding vedtatt med 71 mot 29 stemmer",
      text: "Stortinget ber regjeringen legge fram en plan for fergefri kyststamvei.",
    })
    expect(resultOf(carried)).toEqual({ line: "Forslaget vedtatt med 71 mot 29 stemmer" })
    expect(resultOf(carried, { forslag_betegnelse: "Komiteens tilråding", forslag_tekst: `<p>${"lov ".repeat(200)}</p>` })).toEqual({
      line: "Komiteens tilråding vedtatt med 71 mot 29 stemmer",
    })
  })

  it("reads a vote that was not counted, and one that fell", () => {
    expect(resultOf(unanimous)).toEqual({ line: "Enstemmig vedtatt" })
    expect(
      resultOf(
        { ...carried, alternativ_votering_id: -1, vedtatt: false, antall_for: 20, antall_mot: 80 },
        { forslag_betegnelse: "Forslag nr. 3 fra Sosialistisk Venstreparti", forslag_tekst: "<p>…</p>" },
      ),
    ).toEqual({ line: "Forslag nr. 3 fra Sosialistisk Venstreparti fikk 20 mot 80 stemmer og ble ikke vedtatt" })
  })

  it("counts up many votes on one matter", () => {
    expect(summaryOf([carried, carried, mirror, unanimous])).toEqual({ line: "4 voteringer: 3 vedtatt, 1 ikke vedtatt" })
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
