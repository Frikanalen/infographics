// Draws mainland Norway once and saves it for the CountryMap block.
// Run with `npm run map` if the outline or its level of detail should change.
import fs from "node:fs"
import { createRequire } from "node:module"
import { feature } from "topojson-client"
import { geoArea, geoCentroid, geoConicConformal } from "d3-geo"

const require = createRequire(import.meta.url)
const world = require("world-atlas/countries-10m.json")

const WIDTH = 300
const MIN_STEP = 1.6 // drop coastline points closer together than this

const norway = feature(world, world.objects.countries).features.find(
  (f) => f.properties.name === "Norway",
)
// Mainland and coastal islands only: Svalbard and Jan Mayen would shrink the
// mainland to a third of the map.
const polygons = norway.geometry.coordinates.filter((polygon) => {
  const shape = { type: "Polygon", coordinates: polygon }
  const [lon, lat] = geoCentroid(shape)
  return lat > 57 && lat < 72 && lon > 3 && lon < 32 && geoArea(shape) > 2e-7
})
const mainland = { type: "MultiPolygon", coordinates: polygons }

const ROTATE = [-15, 0]
const PARALLELS = [60, 70]
const projection = geoConicConformal()
  .rotate(ROTATE)
  .parallels(PARALLELS)
  .fitWidth(WIDTH, mainland)

let path = ""
let maxY = 0
for (const polygon of polygons) {
  for (const ring of polygon) {
    const kept = []
    for (const point of ring.map((c) => projection(c))) {
      const last = kept[kept.length - 1]
      if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_STEP)
        kept.push(point)
    }
    if (kept.length < 4) continue
    for (const [, y] of kept) maxY = Math.max(maxY, y)
    path += "M" + kept.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z"
  }
}

fs.writeFileSync(
  new URL("../src/blocks/norway.json", import.meta.url),
  JSON.stringify({
    width: WIDTH,
    height: Math.ceil(maxY),
    rotate: ROTATE,
    parallels: PARALLELS,
    scale: projection.scale(),
    translate: projection.translate(),
    path,
  }),
)
console.log(`norway.json: ${WIDTH}x${Math.ceil(maxY)}, ${path.length} bytes of path`)
