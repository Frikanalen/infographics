import type { Bulletin } from "./bulletins"

/** Sample bulletins, as the API returns them. */
export const example: Bulletin[] = [
  {
    id: 1,
    heading: "Eksempel på en melding",
    template: "standard",
    pages: [
      "Her står meldinger fra Frikanalen. En lang melding deles på flere sider, og hver side står så lenge det tar å lese den.",
      "Dette er den andre siden av den samme meldingen.",
    ],
    pageSeconds: [12, 7],
  },
  {
    id: 2,
    heading: "Eksempel på en viktig melding",
    template: "notice",
    pages: ["En viktig melding er merket, slik at den skiller seg fra de andre."],
    pageSeconds: [9],
  },
]
