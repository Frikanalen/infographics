// The rundown: which pages are shown, in what order, and for how long.
// This is the file to edit to rearrange the broadcast.
//
// A page places modules on a surface twelve columns wide. `module` puts one
// module in a column; `stack` puts several on top of each other.
// A module that has nothing true to show leaves the page, and a page with no
// modules left is skipped.
import type { Page } from "./engine/types"
import { daylightModule } from "./modules/daylight"
import { electricityModule } from "./modules/electricity"
import { passMapModule, passRowsModule } from "./modules/passes"
import { dayChangeModule, solsticeModule } from "./modules/solstice"
import { weatherMapModule, weatherRowsModule } from "./modules/weather"

export const rundown: Page[] = [
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
    id: "strom",
    title: "Strømprisen nå",
    subtitle: "øre per kWh, uten avgifter",
    seconds: 40,
    modules: [{ module: electricityModule, columns: 12 }],
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
