import { geoConicConformal, geoPath } from "d3-geo"
import type { MultiPolygon, Polygon } from "geojson"
import norway from "./norway.json"
import { StateShape, type State } from "./index"

const projection = geoConicConformal()
  .rotate(norway.rotate as [number, number])
  .parallels(norway.parallels as [number, number])
  .scale(norway.scale)
  .translate(norway.translate as [number, number])

const path = geoPath(projection)

/**
 * An area to shade, such as a warning area. Its GeoJSON rings must wind the
 * way d3 expects (clockwise), or the whole world is shaded. `level` 1 to 3
 * shades it more strongly; 3 is drawn in the stop colour.
 */
export interface MapArea {
  geometry: Polygon | MultiPolygon
  level: 1 | 2 | 3
}

export interface MapPoint {
  lat: number
  lon: number
  /** A short text beside the point, such as a temperature. */
  text?: string
  /** Which side of the point the text goes on. Default right. */
  side?: "left" | "right"
  /** Draws the point as a state shape instead of a plain dot. */
  state?: State
}

/**
 * All of mainland Norway, with points on it. It always shows the whole
 * country and never zooms in on a region.
 */
export function CountryMap({ points = [], areas = [] }: { points?: MapPoint[]; areas?: MapArea[] }) {
  // Weaker areas first, so a stronger one is never hidden under a weaker one.
  const shaded = [...areas].sort((a, b) => a.level - b.level)
  return (
    <svg className="map" viewBox={`-8 -8 ${norway.width + 16} ${norway.height + 16}`}>
      <path className="land" d={norway.path} />
      {shaded.map((area, i) => (
        <path key={i} className={`area level-${area.level}`} d={path(area.geometry) ?? undefined} />
      ))}
      {points.map((point, i) => {
        const [x, y] = projection([point.lon, point.lat])!
        const left = point.side === "left"
        return (
          <g key={i}>
            {point.state ? (
              <g transform={`translate(${x - 8} ${y - 8}) scale(0.667)`}>
                <StateShape state={point.state} />
              </g>
            ) : (
              <circle cx={x} cy={y} r="5" fill="var(--fg)" />
            )}
            {point.text && (
              <text x={left ? x - 10 : x + 10} y={y + 6} textAnchor={left ? "end" : "start"}>
                {point.text}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
