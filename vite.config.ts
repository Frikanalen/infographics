import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Relative base, so the built template works from any folder or URL that
// CasparCG is pointed at.
export default defineConfig({
  plugins: [react()],
  base: "./",
})
