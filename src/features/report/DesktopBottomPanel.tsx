// src/features/report/DesktopBottomPanel.tsx
import type { MinistryReport } from "../../domain/reportTypes";
import { AttendanceSummaryStats } from "./AttendanceSummaryStats";
import { ReportHistoryPanel } from "./ReportHistoryPanel";

type DesktopBottomPanelProps = {
  reports: MinistryReport[];
  currentReportId: string;
  currentYear: number;
  onDelete: (report: MinistryReport) => void;
  onDuplicate: (report: MinistryReport) => void;
  onLoad: (report: MinistryReport) => void;
};

export function DesktopBottomPanel({
  reports,
  currentReportId,
  currentYear,
  onDelete,
  onDuplicate,
  onLoad,
}: DesktopBottomPanelProps) {
  return (
    <div className="desktop-bottom-panel">
      <div className="desktop-bottom-left">
        <ReportHistoryPanel
          reports={reports}
          currentReportId={currentReportId}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onLoad={onLoad}
        />
      </div>
      <div className="desktop-bottom-right">
        <AttendanceSummaryStats reports={reports} currentYear={currentYear} />
      </div>
    </div>
  );
}
