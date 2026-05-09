import { useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "./useTheme";

const THEMES: { key: Theme; label: string; color: string }[] = [
  { key: "green", label: "그린", color: "#24564a" },
  { key: "blue", label: "블루", color: "#1a4a8a" },
  { key: "orange", label: "오렌지", color: "#b84a10" },
];

export function ThemeSelector() {
  const [current, setCurrent] = useState<Theme>(getStoredTheme);

  function handleSelect(theme: Theme) {
    applyTheme(theme);
    setCurrent(theme);
  }

  return (
    <div className="theme-selector">
      <span className="theme-selector-label">테마</span>
      <div className="theme-selector-buttons">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`theme-dot${current === t.key ? " is-active" : ""}`}
            style={{ "--dot-color": t.color } as React.CSSProperties}
            title={t.label}
            aria-label={`${t.label} 테마`}
            aria-pressed={current === t.key}
            onClick={() => handleSelect(t.key)}
          />
        ))}
      </div>
    </div>
  );
}
