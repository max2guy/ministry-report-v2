export type Theme = "green" | "blue" | "orange";

const STORAGE_KEY = "ministry-report-v2-theme";

const THEME_COLORS: Record<Theme, string> = {
  green:  "#24564a",
  blue:   "#1a4a8a",
  orange: "#b84a10",
};

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

  // Android 상단 상태바 색상 동기화
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[theme];
}
