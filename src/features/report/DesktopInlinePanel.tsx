// src/features/report/DesktopInlinePanel.tsx
import type { MinistryReport } from "../../domain/reportTypes";

type DesktopInlinePanelProps = {
  reports: MinistryReport[];
  currentReportId: string;
  onLoad: (report: MinistryReport) => void;
  onDelete: (report: MinistryReport) => void;
  onDuplicate: (report: MinistryReport) => void;
};

export function DesktopInlinePanel({
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
                aria-label={`${r.reportDate} ${r.title || `${r.reportDate} 보고서`} 불러오기`}
                aria-current={r.id === currentReportId ? true : undefined}
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
    </div>
  );
}
