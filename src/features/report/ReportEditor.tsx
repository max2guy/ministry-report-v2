import type { ReactNode } from "react";
import type { MinistryReport } from "../../domain/reportTypes";
import { TabbedReportForm } from "./TabbedReportForm";

type ReportEditorProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  accountPanel: ReactNode;
  canSave: boolean;
  historyPanel: ReactNode;
  githubPanel?: ReactNode;
  importPanel: ReactNode;
  onChange: (report: MinistryReport) => void;
  onNewReport: () => void;
  onSave: () => void;
  saveErrors: string[];
  saveStatus: string;
  saveDisabledReason?: string;
};

function downloadReport(report: MinistryReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.reportDate}-ministry-report-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportEditor({
  report,
  reports,
  accountPanel,
  canSave,
  historyPanel,
  githubPanel,
  importPanel,
  onChange,
  onNewReport,
  onSave,
  saveErrors,
  saveStatus,
  saveDisabledReason,
}: ReportEditorProps) {
  return (
    <section className="report-mode">
      <aside className="edit-panel" aria-label="보고서 편집">
        {accountPanel}
        <div className="sidebar-action-panel">
          <button type="button" className="sidebar-btn" onClick={onNewReport}>
            새 보고서
          </button>
          <button
            type="button"
            className="sidebar-btn"
            disabled={!canSave}
            onClick={onSave}
            title={saveDisabledReason}
          >
            저장
          </button>
          <button type="button" className="sidebar-btn sidebar-btn-secondary" onClick={() => downloadReport(report)}>
            내보내기
          </button>
        </div>
        {importPanel}
        {historyPanel}
        {githubPanel}
        {saveErrors.length ? (
          <section className="save-errors" aria-label="저장 오류" role="alert">
            <h2>저장 오류</h2>
            <ul>
              {saveErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {saveStatus ? <p role="status">{saveStatus}</p> : null}
      </aside>
      <div className="editor-workspace">
        <TabbedReportForm report={report} reports={reports} onChange={onChange} />
      </div>
    </section>
  );
}
