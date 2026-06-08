import { useState } from "react";
import type { AppMode } from "../mode/useAppMode";
import type { MinistryReport } from "../../domain/reportTypes";

type MobileReportListProps = {
  reports: MinistryReport[];
  appMode: AppMode;
  onSelectReport: (report: MinistryReport) => void;
  onNewReport: () => void;
  canCreateReport: boolean;
  canDelete?: boolean;
  onDelete?: (report: MinistryReport) => void;
};

function formatDate(dateStr: string): string {
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

function totalAttendance(report: MinistryReport): number {
  return Object.values(report.departments).reduce(
    (sum, dept) => sum + dept.attendance,
    0,
  );
}

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
  canCreateReport,
  canDelete = false,
  onDelete,
}: MobileReportListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  function handleDeleteClick(report: MinistryReport) {
    const [year, month, day] = report.reportDate.split("-").map(Number);
    const confirmed = window.confirm(
      `${year}년 ${month}월 ${day}일 보고서를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (confirmed) {
      onDelete?.(report);
    }
  }

  return (
    <div className="mobile-report-list">
      {canCreateReport && (
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
          <div className="mobile-report-section-header">
            <p className="mobile-report-section-label">
              {canCreateReport ? "저장된 보고서 — 탭하여 수정" : "이전 보고서"}
            </p>
            {canDelete && (
              <button
                type="button"
                className={`mobile-report-edit-toggle${isEditing ? " is-editing" : ""}`}
                onClick={() => setIsEditing((v) => !v)}
              >
                {isEditing ? "완료" : "편집"}
              </button>
            )}
          </div>
          <div className="mobile-report-card-list">
            {reports.map((r) => (
              <div key={r.id} className={`mobile-report-card-row${isEditing ? " is-editing" : ""}`}>
                {isEditing && (
                  <button
                    type="button"
                    className="mobile-report-delete-btn"
                    aria-label={`${r.reportDate} 보고서 삭제`}
                    onClick={() => handleDeleteClick(r)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-report-card"
                  onClick={() => !isEditing && onSelectReport(r)}
                  disabled={isEditing}
                >
                  <div className="mobile-report-card-body">
                    <span className="mobile-report-card-date">
                      {formatDate(r.reportDate)}
                      <span className="mobile-report-card-total"> · {totalAttendance(r)}명</span>
                    </span>
                    <span className="mobile-report-card-summary">{deptSummary(r)}</span>
                  </div>
                  {canCreateReport ? (
                    <span className="mobile-report-card-edit-badge" aria-hidden="true">수정</span>
                  ) : (
                    <span className="mobile-report-card-chevron" aria-hidden="true">›</span>
                  )}
                </button>
              </div>
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
