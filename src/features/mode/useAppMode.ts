import { useCallback, useState } from "react";

export type AppMode = "reporter" | "viewer";

export const STORAGE_KEY = "ministry-app-mode";

export function readStoredMode(): AppMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "viewer" ? "viewer" : "reporter";
  } catch {
    return "reporter";
  }
}

export function useAppMode(): [AppMode, (mode: AppMode) => void] {
  const [appMode, setAppModeState] = useState<AppMode>(readStoredMode);

  const setAppMode = useCallback((mode: AppMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore (e.g. private browsing)
    }
    setAppModeState(mode);
  }, []);

  return [appMode, setAppMode];
}
