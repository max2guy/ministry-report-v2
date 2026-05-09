import type { MinistryReport } from "../../domain/reportTypes";
import { AdultStatsPanel } from "./AdultStatsPanel";
import { ReportCanvas } from "./ReportCanvas";
import { DeptStatsPanel } from "./DeptStatsPanel";

type ReportViewerProps = {
  report: MinistryReport;
  reports: MinistryReport[];
};

const FLAT_DEPT_KEYS = ["elementary", "middleHigh", "youngAdult"] as const;

export function ReportViewer({ report, reports }: ReportViewerProps) {
  const hasFlatMembers = FLAT_DEPT_KEYS.some(
    (k) => (report.departments[k].members?.length ?? 0) > 0,
  );
  const hasAdultZones = (report.departments.adult.zones?.length ?? 0) > 0;
  const hasStats = hasFlatMembers || hasAdultZones;

  return (
    <section className="report-mode viewer-mode">
      <div className="viewer-actions" aria-label="뷰어 작업">
        <button type="button" onClick={() => window.print()}>
          인쇄
        </button>
      </div>
      <ReportCanvas report={report} />

      {hasStats && (
        <div className="viewer-stats">
          <h3 className="viewer-stats-title">출결 통계</h3>
          <div className="viewer-stats-grid">
            {FLAT_DEPT_KEYS.map((key) => {
              const dept = report.departments[key];
              if (!dept.members || dept.members.length === 0) return null;
              return (
                <DeptStatsPanel
                  key={key}
                  dept={dept}
                  deptKey={key}
                  reportDate={report.reportDate}
                  reports={reports}
                />
              );
            })}
            {hasAdultZones && (
              <AdultStatsPanel
                dept={report.departments.adult}
                reportDate={report.reportDate}
                reports={reports}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
