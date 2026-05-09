export type Theme = "green" | "blue" | "orange";

const STORAGE_KEY = "ministry-report-v2-theme";

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "blue" || stored === "orange" || stored === "green") return stored;
  return "green";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "green") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  localStorage.setItem(STORAGE_KEY, theme);
}
