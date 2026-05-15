// src/features/report/ReportEditor.tsx
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";
import { TabbedReportForm } from "./TabbedReportForm";

type ReportEditorProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  onChange: (report: MinistryReport) => void;
  editableDepts: DepartmentKey[] | "all";
};

export function ReportEditor({
  report,
  reports,
  onChange,
  editableDepts,
}: ReportEditorProps) {
  return (
    <TabbedReportForm
      report={report}
      reports={reports}
      onChange={onChange}
      editableDepts={editableDepts}
    />
  );
}
