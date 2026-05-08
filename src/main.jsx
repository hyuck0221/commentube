import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

function renderFallback(error) {
  const root = document.getElementById("root");
  root.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;padding:40px;color:#fff;background:#090a0f;font-family:system-ui">
    <div style="max-width:720px;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:24px;background:rgba(255,255,255,.08)">
      <h1 style="margin-top:0;font-size:28px">Commentube failed to start</h1>
      <pre style="white-space:pre-wrap;color:#ffd2d7">${String(error?.message || error)}</pre>
    </div>
  </main>`;
}

try {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  renderFallback(error);
}

window.addEventListener("error", (event) => renderFallback(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => renderFallback(event.reason));
