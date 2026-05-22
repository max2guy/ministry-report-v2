// src/features/nav/DesktopSidebar.tsx
import type { Account } from "../../auth/authTypes";
import type { MinistryReport } from "../../domain/reportTypes";
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
  installState: "unavailable" | "ready" | "installed";
  onInstall: () => void;
  onForceRefresh: () => void;
  // 보고서 목록
  reports: MinistryReport[];
  currentReportId: string;
  onLoadReport: (report: MinistryReport) => void;
  onDeleteReport: (report: MinistryReport) => void;
  onDuplicateReport: (report: MinistryReport) => void;
};

const NAV_ITEMS: { key: DesktopMode; label: string; icon: string }[] = [
  {
    key: "edit",
    label: "보고서",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  },
  {
    key: "view",
    label: "뷰어",
    icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  },
  {
    key: "roster",
    label: "명단",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    key: "settings",
    label: "설정",
    icon: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  },
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
  reports,
  currentReportId,
  onLoadReport,
  onDeleteReport,
  onDuplicateReport,
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
        {NAV_ITEMS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            aria-current={mode === key ? "page" : undefined}
            className={`desktop-nav-item${mode === key ? " is-active" : ""}`}
            onClick={() => onModeChange(key)}
          >
            <svg
              className="desktop-nav-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon.split(" M").map((d, i) => (
                <path key={i} d={i === 0 ? d : `M${d}`} />
              ))}
            </svg>
            {label}
          </button>
        ))}
      </div>

      {/* 비편집 모드: 빈 공간 채우기 */}
      {mode !== "edit" && <div className="desktop-sidebar-spacer" />}

      {/* 저장된 보고서 목록 */}
      {mode === "edit" && (
        <div className="desktop-sidebar-reports">
          <div className="dsb-reports-header">
            <span>저장된 보고서</span>
          </div>
          <ul className="dsb-reports-list">
            {reports.map((r) => (
              <li key={r.id} className={`dsb-report-item${r.id === currentReportId ? " is-current" : ""}`}>
                <button
                  type="button"
                  className="dsb-report-load"
                  onClick={() => onLoadReport(r)}
                  aria-label={`${r.reportDate} ${r.title || `${r.reportDate} 보고서`} 불러오기`}
                  aria-current={r.id === currentReportId ? true : undefined}
                >
                  <span className="dsb-report-date">{r.reportDate}</span>
                  <span className="dsb-report-title">{r.title || `${r.reportDate} 보고서`}</span>
                  {r.id === currentReportId && <span className="dsb-report-badge">현재</span>}
                </button>
                <div className="dsb-report-actions">
                  <button
                    type="button"
                    className="dsb-report-dup"
                    onClick={() => onDuplicateReport(r)}
                    title="복사"
                  >복사</button>
                  <button
                    type="button"
                    className="dsb-report-del"
                    onClick={() => {
                      if (window.confirm(`${r.reportDate} 보고서를 삭제할까요?`)) {
                        onDeleteReport(r);
                      }
                    }}
                    title="삭제"
                  >삭제</button>
                </div>
              </li>
            ))}
            {reports.length === 0 && (
              <li className="dsb-report-empty">저장된 보고서 없음</li>
            )}
          </ul>
        </div>
      )}

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
