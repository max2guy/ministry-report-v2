// src/features/report/DesktopInlinePanel.tsx
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";

type DesktopInlinePanelProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  currentReportId: string;
  onLoad: (report: MinistryReport) => void;
  onDelete: (report: MinistryReport) => void;
  onDuplicate: (report: MinistryReport) => void;
};

type DeptInfo = {
  key: DepartmentKey;
  label: string;
  color: string;
  barColor: string;
};

const DEPTS: DeptInfo[] = [
  { key: "elementary", label: "유초등부", color: "#2148c0", barColor: "#2148c0" },
  { key: "middleHigh", label: "중고등부", color: "#0f766e", barColor: "#0f766e" },
  { key: "youngAdult", label: "청년부",   color: "#7c3aed", barColor: "#7c3aed" },
  { key: "adult",      label: "교구",     color: "#d97706", barColor: "#d97706" },
];

function getDeptTotal(report: MinistryReport, key: DepartmentKey): number {
  const dept = report.departments[key];
  if (dept.zones)   return dept.zones.reduce((s, z) => s + z.members.length, 0);
  if (dept.members) return dept.members.length;
  return 0;
}

export function DesktopInlinePanel({
  report,
  reports,
  currentReportId,
  onLoad,
  onDelete,
  onDuplicate,
}: DesktopInlinePanelProps) {
  return (
    <div className="desktop-inline-panel">
      {/* ── 좌측: 보고서 목록 ── */}
      <div className="dip-list">
        <div className="dip-list-header">저장된 보고서</div>
        <ul className="dip-list-body">
          {reports.slice().reverse().map((r) => (
            <li key={r.id} className={`dip-list-item${r.id === currentReportId ? " is-current" : ""}`}>
              <button
                type="button"
                className="dip-list-load"
                onClick={() => onLoad(r)}
              >
                <span className="dip-list-date">{r.reportDate}</span>
                <span className="dip-list-title">{r.title || `${r.reportDate} 보고서`}</span>
                {r.id === currentReportId && (
                  <span className="dip-list-badge">현재</span>
                )}
              </button>
              <div className="dip-list-actions">
                <button
                  type="button"
                  className="dip-list-dup"
                  onClick={() => onDuplicate(r)}
                  title="복사"
                >
                  복사
                </button>
                <button
                  type="button"
                  className="dip-list-del"
                  onClick={() => {
                    if (window.confirm(`${r.reportDate} 보고서를 삭제할까요?`)) {
                      onDelete(r);
                    }
                  }}
                  title="삭제"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="dip-list-empty">저장된 보고서가 없습니다.</li>
          )}
        </ul>
      </div>

      {/* ── 우측: 4부서 통계 카드 ── */}
      <div className="dip-stats">
        <div className="dip-stats-header">
          출결 통계
          <span className="dip-stats-month">{report.reportDate.slice(0, 7)}</span>
        </div>
        <div className="dip-stats-cards">
          {DEPTS.map(({ key, label, color, barColor }) => {
            const total   = getDeptTotal(report, key);
            const present = report.departments[key].attendance;
            const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
            return (
              <div key={key} className="dip-stat-card">
                <div className="dip-stat-label">{label}</div>
                <div className="dip-stat-pct" style={{ color }}>{pct}%</div>
                <div className="dip-stat-count">{present}/{total}명</div>
                <div className="dip-stat-bar">
                  <div
                    className="dip-stat-bar-fill"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
