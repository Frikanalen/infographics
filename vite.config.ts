import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Data sources that a web page cannot call by itself, because a browser will
// not let a page choose its own User-Agent. The template asks its own server
// for /met/..., and the server asks MET. Statnett sends no CORS header, so
// /statnett/... is passed on the same way. nginx.conf does the same on air:
// keep the two alike.
const proxy = {
  "/met": {
    target: "https://api.met.no",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/met/, "/weatherapi"),
    headers: { "User-Agent": "frikanalen-infographics/0.1 github.com/Frikanalen/infographics" },
  },
  // Statnett sends no CORS header, so a page cannot read it directly.
  "/statnett": {
    target: "https://driftsdata.statnett.no",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/statnett/, "/restapi"),
  },
  // The Storting's open data, the same way, so its answers can be cached.
  "/stortinget": {
    target: "https://data.stortinget.no",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/stortinget/, "/eksport"),
    headers: { "User-Agent": "frikanalen-infographics/0.1 github.com/Frikanalen/infographics" },
  },
}

// Relative base, so the built template works from any folder or URL that
// CasparCG is pointed at.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { proxy },
  preview: { proxy },
})
