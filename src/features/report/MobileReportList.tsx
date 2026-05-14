import type { AppMode } from "../mode/useAppMode";
import type { MinistryReport } from "../../domain/reportTypes";

type MobileReportListProps = {
  reports: MinistryReport[];
  appMode: AppMode;
  onSelectReport: (report: MinistryReport) => void;
  onNewReport: () => void;
};

function formatDate(dateStr: string): string {
  // dateStr format: "2026-05-10"
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${year}년 ${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

const DEPT_LABELS: { key: "elementary" | "middleHigh" | "youngAdult" | "adult"; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

function deptSummary(report: MinistryReport): string {
  return DEPT_LABELS
    .filter(({ key }) => report.departments[key].attendance > 0)
    .map(({ key, label }) => `${label} ${report.departments[key].attendance}`)
    .join(" · ");
}

export function MobileReportList({
  reports,
  appMode,
  onSelectReport,
  onNewReport,
}: MobileReportListProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="mobile-report-list">
      {appMode === "reporter" && (
        <button
          type="button"
          className="mobile-report-new-btn"
          onClick={onNewReport}
        >
          <span className="mobile-report-new-text">
            <span className="mobile-report-new-title">+ 새 보고서 작성</span>
            <span className="mobile-report-new-date">{todayStr}</span>
          </span>
          <span className="mobile-report-new-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </button>
      )}

      {reports.length > 0 && (
        <>
          <p className="mobile-report-section-label">
            {appMode === "reporter" ? "저장된 보고서 — 탭하여 수정" : "이전 보고서"}
          </p>
          <div className="mobile-report-card-list">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                className="mobile-report-card"
                onClick={() => onSelectReport(r)}
              >
                <div className="mobile-report-card-body">
                  <span className="mobile-report-card-date">{formatDate(r.reportDate)}</span>
                  <span className="mobile-report-card-summary">{deptSummary(r)}</span>
                </div>
                {appMode === "reporter" ? (
                  <span className="mobile-report-card-edit-badge" aria-hidden="true">수정</span>
                ) : (
                  <span className="mobile-report-card-chevron" aria-hidden="true">›</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {reports.length === 0 && appMode === "viewer" && (
        <p className="mobile-report-empty">저장된 보고서가 없습니다</p>
      )}
    </div>
  );
}
