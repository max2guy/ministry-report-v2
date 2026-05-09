import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  } else {
    // Dev mode: unregister all service workers so Vite dev server serves fresh files
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((r) => void r.unregister()));
  }
}
