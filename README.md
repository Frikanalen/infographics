# infographics

A CasparCG template that can hold Frikanalen's air for hours: calm pages of
public information for the whole country, on a clock, in rotation.

It is separate from [on-air-graphics](https://github.com/Frikanalen/on-air-graphics),
which fills the gaps between programmes.

## Try it

```
npm install
npm run dev
```

Then open the address Vite prints. Useful additions to the address:

| | |
|---|---|
| `?demo=1` | draw every module from its example data, marked EKSEMPELDATA |
| `?page=dagslys` | stay on one page while you work on it |

The right arrow key moves to the next page.

Without `?demo=1` the template only shows what it can stand behind: modules
with live or computed data. Example figures never go on air unmarked.

## How it is put together

```
src/
  rundown.ts     which pages are shown, in what order, for how long
  modules/       one folder per thing worth showing
  blocks/        the pieces modules are built from
  places.ts      places and their official names
  styles/        the design language: tokens.css is the place to start
  frame/         stripe, head with clock, foot with source and progress
  engine/        rotation, loading, time and sun calculations
```

**To rearrange the broadcast**, edit `src/rundown.ts`. A page places modules
on a surface twelve columns wide:

```ts
{
  id: "dagslys",
  title: "Dagslys",
  seconds: 40,
  modules: [
    { module: daylightModule, columns: 8 },
    { stack: [solsticeModule, dayChangeModule], columns: 4 },
  ],
}
```

**To make a module**, copy a folder in `src/modules/` and change it. A module
is an object with:

- `source`: shown in the footer after "Kilde:"
- `load`: fetches or computes the data. Leave it out and the module only
  appears in demo mode.
- `maxAgeMinutes`: data older than this is not shown
- `example`: sample data, so the module can be seen without a network
- `View`: draws the data, using the blocks

Build the view from the blocks in `src/blocks/` (`Rows`, `Row`, `PlaceName`,
`HeroNumber`, `CountryMap`, `HourBars`, `DayTrack`, `Status`, `Notice`) and a
module rarely needs CSS of its own.

## The design language

- **Each colour has one job.** Amber is time, coral is stop, green is go, plum
  marks the source. Data is drawn in the neutral foreground.
- **North to south.** Every list and map runs from north to south, and no
  place is treated as home.
- **Flat and ruled.** Hairlines and whitespace, no cards or shadows.
- **Nothing moves while it is being read.** Pages change with a short fade.
- **Every page names its source.** A module with stale data leaves the page,
  and a page with nothing left is skipped.
- Nothing is set smaller than 22 px at 720p.

The typeface is [Schibsted Grotesk](https://github.com/schibsted/schibsted-grotesk),
under the SIL Open Font License.

## What is live

| Module | Data |
|---|---|
| Daylight, solstice, day change | computed in the template |
| Electricity | hvakosterstrommen.no, fetched by the template |
| Weather, mountain passes | example only, waiting for a data service |

## On air

`npm run build` writes the template to `dist/`. Point a CasparCG HTML
producer at `dist/index.html`, or at wherever `dist/` is served. The template
is 1280×720, starts by itself, and answers to `play()`, `stop()` and `next()`.
