import "@fontsource-variable/schibsted-grotesk"
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import "./styles/tokens.css"
import "./styles/frame.css"
import "./styles/blocks.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
