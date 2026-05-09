import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// SW 등록은 vite-plugin-pwa가 PROD 빌드 시 자동 처리.
// DEV 모드에서는 기존 SW를 해제하여 Vite dev server 응답이 캐시에 막히지 않게 함.
if ("serviceWorker" in navigator && import.meta.env.DEV) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((r) => void r.unregister()));
}
