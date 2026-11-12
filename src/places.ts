// Places the modules can use. Lists on screen always run north to south, and
// no place is treated as home.
//
// Where a place has more than one official name, list them all: the PlaceName
// block lets them take turns.
export interface Place {
  names: string | string[]
  lat: number
  lon: number
}

export const places = {
  longyearbyen: { names: "Longyearbyen", lat: 78.22, lon: 15.63 },
  vadso: { names: ["Čáhcesuolu", "Vadsø", "Vesisaari"], lat: 70.07, lon: 29.75 },
  karasjok: { names: ["Kárášjohka", "Karasjok"], lat: 69.47, lon: 25.52 },
  tromso: { names: ["Romsa", "Tromsø"], lat: 69.65, lon: 18.96 },
  bodo: { names: ["Bådåddjo", "Bodø"], lat: 67.28, lon: 14.4 },
  trondheim: { names: "Trondheim", lat: 63.43, lon: 10.4 },
  alesund: { names: "Ålesund", lat: 62.47, lon: 6.15 },
  bergen: { names: "Bergen", lat: 60.39, lon: 5.32 },
  oslo: { names: "Oslo", lat: 59.91, lon: 10.75 },
  kristiansand: { names: "Kristiansand", lat: 58.15, lon: 8.0 },
} satisfies Record<string, Place>

export const northToSouth = <T extends { lat: number }>(list: T[]): T[] =>
  [...list].sort((a, b) => b.lat - a.lat)
