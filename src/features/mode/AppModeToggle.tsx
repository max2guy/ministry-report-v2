import type { AppMode } from "./useAppMode";

type AppModeToggleProps = {
  appMode: AppMode;
  onAppModeChange: (mode: AppMode) => void;
};

export function AppModeToggle({ appMode, onAppModeChange }: AppModeToggleProps) {
  return (
    <div className="app-mode-toggle">
      <span className="app-mode-toggle-label">앱 모드</span>
      <div className="app-mode-toggle-buttons" role="group" aria-label="앱 모드 선택">
        <button
          type="button"
          className={`app-mode-btn${appMode === "reporter" ? " active" : ""}`}
          aria-pressed={appMode === "reporter"}
          onClick={() => onAppModeChange("reporter")}
        >
          ✏️ 보고자
        </button>
        <button
          type="button"
          className={`app-mode-btn${appMode === "viewer" ? " active" : ""}`}
          aria-pressed={appMode === "viewer"}
          onClick={() => onAppModeChange("viewer")}
        >
          👁 뷰어
        </button>
      </div>
      {appMode === "viewer" && (
        <p className="app-mode-hint">뷰어 모드: 보고서를 읽기 전용으로 봅니다</p>
      )}
    </div>
  );
}
