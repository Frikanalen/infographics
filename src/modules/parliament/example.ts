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
      notes: [],
      agenda: [
        { number: 1, text: "Redegjørelse av kultur- og likestillingsministeren om mediepolitikk og ytringsfrihet" },
        {
          number: 2,
          text: "Representantforslag om å be regjeringa greie ut alternativet «Ny framtid for Nationaltheatret» grundigare",
        },
      ],
    },
    {
      date: dayKey(at(0)),
      start: at(0),
      notes: ["Votering kl. 14.00"],
      agenda: [
        { number: 1, text: "Endringer i statsbudsjettet 2026 under Kommunal- og distriktsdepartementet" },
        { number: 2, text: "Representantforslag om en nasjonal plan for fergefri kyststamvei" },
        { number: 3, text: "Lov om endringer i opplæringslova (rett til fysisk skolebibliotek)" },
        { number: 4, text: "Riksrevisjonens undersøkelse av myndighetenes arbeid med digital sikkerhet" },
        { number: 5, text: "Representantforslag om å sikre beredskapslagring av korn" },
        { number: 6, text: "Interpellasjon om tannhelsetilbudet i distriktene" },
      ],
    },
    { date: dayKey(at(1)), start: at(1), notes: ["Votering kl. 15.00"], agenda: null },
  ]
}
