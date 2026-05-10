import { useState } from "react";

export type AppMode = "reporter" | "viewer";

const STORAGE_KEY = "ministry-app-mode";

export function readStoredMode(): AppMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "viewer" ? "viewer" : "reporter";
}

export function useAppMode(): [AppMode, (mode: AppMode) => void] {
  const [appMode, setAppModeState] = useState<AppMode>(readStoredMode);

  function setAppMode(mode: AppMode) {
    localStorage.setItem(STORAGE_KEY, mode);
    setAppModeState(mode);
  }

  return [appMode, setAppMode];
}
