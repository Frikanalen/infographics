import type { InfoModule } from "../../engine/types"
import { loadBulletins, screens, type Bulletin } from "./bulletins"
import { example } from "./example"

/**
 * The channel's own bulletins, one page to a screen. Each screen is held
 * for as long as the page takes to read, which the API works out.
 */
export const bulletinsModule: InfoModule<Bulletin[]> = {
  id: "bulletins",
  source: "Frikanalen",
  // Often, so a bulletin taken down leaves the screen soon after.
  refreshMinutes: 2,
  maxAgeMinutes: 30,
  load: loadBulletins,
  example,
  steps: (data) => Math.max(1, screens(data).length),
  stepSeconds: (data, step) => screens(data)[step]?.seconds,
  View: ({ data, step }) => {
    const all = screens(data)
    const screen = all[Math.min(step, all.length - 1)]
    if (!screen) return null
    const { bulletin, page, text } = screen
    return (
      <article className="bulletin">
        {bulletin.template === "notice" && <div className="bulletin-label">Viktig melding</div>}
        <h2>{bulletin.heading}</h2>
        {text
          .split(/\n+/)
          .filter((line) => line.trim())
          .map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        {bulletin.pages.length > 1 && (
          <div className="bulletin-page">
            {page + 1} / {bulletin.pages.length}
          </div>
        )}
      </article>
    )
  },
}
