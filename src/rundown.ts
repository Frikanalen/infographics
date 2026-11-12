// The rundown: which pages are shown, in what order, and for how long.
// This is the file to edit to rearrange the broadcast.
//
// A page places modules on a surface twelve columns wide. `module` puts one
// module in a column; `stack` puts several on top of each other.
// A module that has nothing true to show leaves the page, and a page with no
// modules left is skipped.
import type { Page } from "./engine/types"
import { avalancheModule } from "./modules/avalanche"
import { daylightModule } from "./modules/daylight"
import { electricityModule } from "./modules/electricity"
import { powerFlowRowsModule, powerNetModule } from "./modules/powerflow"
import { parliamentFirstModule, parliamentSecondModule } from "./modules/parliament"
import { passMapModule, passRowsModule } from "./modules/passes"
import { scheduleModule } from "./modules/schedule"
import { dayChangeModule, solsticeModule } from "./modules/solstice"
import { warningMapModule, warningRowsModule } from "./modules/warnings"
import { trainsModule } from "./modules/trains"
import { weatherMapModule, weatherRowsModule } from "./modules/weather"

export const rundown: Page[] = [
  {
    id: "frikanalen",
    title: "På Frikanalen",
    subtitle: "senere i dag",
    seconds: 30,
    modules: [{ module: scheduleModule, columns: 12 }],
  },
  {
    id: "dagslys",
    title: "Dagslys",
    subtitle: "soloppgang og solnedgang i dag",
    seconds: 40,
    modules: [
      { module: daylightModule, columns: 8 },
      { stack: [solsticeModule, dayChangeModule], columns: 4 },
    ],
  },
  {
    id: "stortinget",
    title: "Stortinget",
    subtitle: "dagsorden i stortingssalen",
    seconds: 45,
    modules: [
      { module: parliamentFirstModule, columns: 6 },
      { module: parliamentSecondModule, columns: 6 },
    ],
  },
  {
    id: "vaer",
    title: "Været nå",
    subtitle: "hele landet, fra nord til sør",
    seconds: 45,
    modules: [
      { module: weatherMapModule, columns: 4 },
      { module: weatherRowsModule, columns: 8 },
    ],
  },
  {
    id: "farevarsler",
    title: "Farevarsler",
    subtitle: "fra MET, for land og kyst",
    seconds: 45,
    modules: [
      { module: warningMapModule, columns: 4 },
      { module: warningRowsModule, columns: 8 },
    ],
  },
  {
    id: "snoskred",
    title: "Snøskredfare",
    subtitle: "i fjellet, i dag og i morgen",
    seconds: 40,
    modules: [{ module: avalancheModule, columns: 12 }],
  },
  {
    id: "tog",
    title: "Togene",
    subtitle: "neste avgang fra stasjoner over hele landet",
    seconds: 40,
    modules: [{ module: trainsModule, columns: 12 }],
  },
  {
    id: "strom",
    title: "Strømprisen nå",
    subtitle: "øre per kWh, uten avgifter",
    seconds: 40,
    modules: [{ module: electricityModule, columns: 12 }],
  },
  {
    id: "kraftflyt",
    title: "Kraftflyt",
    subtitle: "strøm inn og ut av Norge akkurat nå",
    seconds: 40,
    modules: [
      { module: powerNetModule, columns: 4 },
      { module: powerFlowRowsModule, columns: 8 },
    ],
  },
  {
    id: "fjell",
    title: "Fjellovergangene",
    seconds: 40,
    modules: [
      { module: passMapModule, columns: 4 },
      { module: passRowsModule, columns: 8 },
    ],
  },
]
