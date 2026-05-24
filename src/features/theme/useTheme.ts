export type Theme = "green" | "blue" | "orange";

const STORAGE_KEY = "ministry-report-v2-theme";
const THEME_MIGRATED_KEY = "ministry-report-v2-theme-migrated-v1";

const THEME_COLORS: Record<Theme, string> = {
  green:  "#24564a",
  blue:   "#1a4a8a",
  orange: "#b84a10",
};

export function getStoredTheme(): Theme {
  // v2.7.x 이전엔 green이 기본값이었음 → 명시적으로 green을 고른 게 아니라면 blue로 마이그레이션
  if (!localStorage.getItem(THEME_MIGRATED_KEY)) {
    localStorage.setItem(THEME_MIGRATED_KEY, "1");
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "green") {
      localStorage.setItem(STORAGE_KEY, "blue");
    }
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "blue" || stored === "orange" || stored === "green") return stored;
  return "blue";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "blue") {
    root.removeAttribute("data-theme"); // blue = :root default
  } else {
    root.setAttribute("data-theme", theme); // green / orange
  }
  localStorage.setItem(STORAGE_KEY, theme);

  // Android 알림바는 항상 검은색 고정 (로딩바/gap 색상 문제 방지)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = "#000000";
}
