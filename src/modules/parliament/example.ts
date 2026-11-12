// Example data is made around the day it is drawn on, so the page always
// has a yesterday, a today and a tomorrow to show.
import { dayKey, type Sittings } from "./stortinget"

const DAY = 86400000

export function exampleSittings(now: Date): Sittings {
  // 10:00 Norwegian winter time on the day `offset` days from now.
  const at = (offset: number) => Date.parse(`${dayKey(now.getTime() + offset * DAY)}T10:00:00+01:00`)
  return [
    {
      date: dayKey(at(-1)),
      start: at(-1),
      notes: ["Votering kl. 15.00"],
      agenda: [
        { number: 1, text: "Redegjørelse av kultur- og likestillingsministeren om mediepolitikk og ytringsfrihet" },
        {
          number: 2,
          text: "Representantforslag om en tydelig og forpliktende integreringskontrakt",
          from: "Innstilling fra kommunal- og forvaltningskomiteen, forslag fra Kari Nordmann, Ola Nordmann, Per Hansen og Anne Olsen",
        },
        {
          number: 3,
          text: "Representantforslag om egenbetaling for tolketjenester etter tre års opphold i Norge",
          from: "Innstilling fra kommunal- og forvaltningskomiteen, forslag fra Kari Nordmann og Ola Nordmann",
        },
        {
          number: 4,
          text: "Redegjørelse av justis- og beredskapsministeren om PST og Justis- og beredskapsdepartementets styring av PST",
          remark: "Det vil bli foreslått debatt umiddelbart etter redegjørelsen",
        },
      ],
    },
    {
      date: dayKey(at(0)),
      start: at(0),
      notes: ["Votering kl. 14.00"],
      agenda: [
        {
          number: 1,
          text: "Debatt om kultur- og likestillingsministerens redegjørelse om mediepolitikk og ytringsfrihet",
          remark: "Redegjørelsen holdt i Stortingets møte i går",
        },
        {
          number: 2,
          text: "Representantforslag om å be regjeringa greie ut alternativet «Ny framtid for Nationaltheatret» grundigare",
          from: "Innstilling fra familie- og kulturkomiteen, forslag fra Kari Nordmann, Ola Nordmann og Per Hansen",
        },
      ],
    },
    { date: dayKey(at(1)), start: at(1), notes: ["Votering kl. 15.00"], agenda: null },
  ]
}
