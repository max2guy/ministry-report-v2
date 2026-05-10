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
  { key: "elementary", label: "초등" },
  { key: "middleHigh", label: "중고등" },
  { key: "youngAdult", label: "청년" },
  { key: "adult", label: "장년" },
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
          <span className="mobile-report-new-icon" aria-hidden="true">✏️</span>
        </button>
      )}

      {reports.length > 0 && (
        <>
          <p className="mobile-report-section-label">이전 보고서</p>
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
                <span className="mobile-report-card-chevron" aria-hidden="true">›</span>
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
