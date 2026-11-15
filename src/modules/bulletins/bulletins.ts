// Reads the channel's own bulletins from Frikanalen's API: the ones marked
// for the infographics and running now. The API pages the text (the same
// rule as on air and in the editor) and says how long each page takes to
// read, so nothing is paged here.

export interface Bulletin {
  id: number
  heading: string
  /** "notice" is marked as an important message. */
  template: string
  pages: string[]
  /** How long each page is held, in seconds. */
  pageSeconds: number[]
}

/** One screen: one page of one bulletin. */
export interface Screen {
  bulletin: Bulletin
  /** Which of the bulletin's pages this is, from 0. */
  page: number
  text: string
  seconds: number
}

/** A page is never held shorter than this, whatever the API says. */
const SHORTEST_SECONDS = 5

/** Keep what can be shown: a heading or some text, paged by the API. */
export function parseBulletins(rows: unknown): Bulletin[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row): Bulletin[] => {
    const { id, heading, template, pages, pageSeconds } = (row ?? {}) as Record<string, unknown>
    if (typeof id !== "number" || !Array.isArray(pages)) return []
    const texts = pages.filter((page): page is string => typeof page === "string")
    const title = typeof heading === "string" ? heading.trim() : ""
    if (!title && !texts.some((text) => text.trim())) return []
    const seconds = Array.isArray(pageSeconds) ? pageSeconds : []
    const shown = texts.length ? texts : [""]
    return [
      {
        id,
        heading: title,
        template: template === "notice" ? "notice" : "standard",
        pages: shown,
        pageSeconds: shown.map((_, i) => Math.max(SHORTEST_SECONDS, Number(seconds[i]) || 0)),
      },
    ]
  })
}

/** Every page of every bulletin, in the order the API lists the bulletins. */
export const screens = (bulletins: Bulletin[]): Screen[] =>
  bulletins.flatMap((bulletin) =>
    bulletin.pages.map((text, page) => ({ bulletin, page, text, seconds: bulletin.pageSeconds[page] })),
  )

export async function loadBulletins(): Promise<Bulletin[] | null> {
  const response = await fetch("https://frikanalen.tv/api/news/bulletins?placement=infographics", {
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Frikanalen: ${response.status}`)
  const body: { results?: unknown } = await response.json()
  const bulletins = parseBulletins(body.results)
  // Nothing running: the page leaves the rundown until there is.
  return bulletins.length ? bulletins : null
}
