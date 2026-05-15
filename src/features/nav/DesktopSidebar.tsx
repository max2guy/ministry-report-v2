// src/features/nav/DesktopSidebar.tsx
import type { Account } from "../../auth/authTypes";
import { ThemeSelector } from "../theme/ThemeSelector";

export type DesktopMode = "edit" | "view" | "roster" | "settings";

type DesktopSidebarProps = {
  appVersion: string;
  currentAccount: Account | null | undefined;
  mode: DesktopMode;
  onModeChange: (mode: DesktopMode) => void;
  onSignOut: () => void;
  onNewReport: () => void;
  canSave: boolean;
  onSave: () => void;
  onExport: () => void;
  installState: "idle" | "ready" | "installed";
  onInstall: () => void;
  onForceRefresh: () => void;
};

const NAV_ITEMS: { key: DesktopMode; label: string }[] = [
  { key: "edit",     label: "보고서" },
  { key: "view",     label: "뷰어" },
  { key: "roster",   label: "명단" },
  { key: "settings", label: "설정" },
];

export function DesktopSidebar({
  appVersion,
  currentAccount,
  mode,
  onModeChange,
  onSignOut,
  onNewReport,
  canSave,
  onSave,
  onExport,
  installState,
  onInstall,
  onForceRefresh,
}: DesktopSidebarProps) {
  return (
    <nav className="desktop-sidebar" aria-label="사이드바 네비게이션">
      {/* 앱 타이틀 */}
      <div className="desktop-sidebar-header">
        <span className="desktop-sidebar-title">사역보고서</span>
        <span className="desktop-sidebar-version">v{appVersion}</span>
      </div>

      {/* 계정 */}
      {currentAccount && (
        <div className="desktop-sidebar-account">
          <div className="desktop-sidebar-avatar">
            {(currentAccount.displayName.charAt(0) || currentAccount.email.charAt(0)).toUpperCase()}
          </div>
          <div className="desktop-sidebar-account-info">
            <strong className="desktop-sidebar-account-name">
              {currentAccount.displayName}
            </strong>
            <span className="desktop-sidebar-account-email">
              {currentAccount.email}
            </span>
          </div>
          <button
            type="button"
            className="desktop-sidebar-signout"
            onClick={onSignOut}
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="desktop-sidebar-nav">
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-current={mode === key ? "page" : undefined}
            className={`desktop-nav-item${mode === key ? " is-active" : ""}`}
            onClick={() => onModeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 액션 버튼 (편집 모드일 때만) */}
      {mode === "edit" && (
        <div className="desktop-sidebar-actions">
          <button
            type="button"
            className="desktop-action-btn"
            onClick={onNewReport}
          >
            새 보고서
          </button>
          <button
            type="button"
            className="desktop-action-btn desktop-action-btn-primary"
            disabled={!canSave}
            onClick={onSave}
          >
            저장
          </button>
          <button
            type="button"
            className="desktop-action-btn desktop-action-btn-secondary"
            onClick={onExport}
          >
            내보내기
          </button>
        </div>
      )}

      {/* 하단 유틸리티 */}
      <div className="desktop-sidebar-utils">
        <ThemeSelector />
        <button
          type="button"
          className="desktop-util-btn"
          onClick={onForceRefresh}
          title="강제 새로고침 (캐시 초기화)"
          aria-label="강제 새로고침"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </button>
        {installState === "ready" && (
          <button
            type="button"
            className="desktop-util-btn"
            onClick={onInstall}
            aria-label="앱 설치"
          >
            📲 설치
          </button>
        )}
        {installState === "installed" && (
          <span className="pwa-installed-badge">✓ 설치됨</span>
        )}
      </div>
    </nav>
  );
}
