import { useRef } from "react";
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";
import { AdultStatsPanel } from "./AdultStatsPanel";
import { ReportCanvas } from "./ReportCanvas";
import { DeptStatsPanel } from "./DeptStatsPanel";

type Tab = {
  key: "summary" | DepartmentKey;
  label: string;
};

type ReportViewerProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  activeTabIdx: number;
  tabs: Tab[];
  onTabChange: (i: number) => void;
};

export function ReportViewer({ report, reports, activeTabIdx, tabs, onTabChange }: ReportViewerProps) {
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && activeTabIdx < tabs.length - 1) onTabChange(activeTabIdx + 1);
      if (dx > 0 && activeTabIdx > 0) onTabChange(activeTabIdx - 1);
    }
    touchStartX.current = null;
  }

  const activeKey = tabs[activeTabIdx]?.key ?? "summary";

  return (
    <section
      className="report-mode viewer-mode"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {activeKey === "summary" ? (
        <ReportCanvas report={report} />
      ) : activeKey === "adult" ? (
        <AdultStatsPanel
          dept={report.departments.adult}
          reportDate={report.reportDate}
          reports={reports}
        />
      ) : (
        <DeptStatsPanel
          dept={report.departments[activeKey]}
          deptKey={activeKey}
          reportDate={report.reportDate}
          reports={reports}
        />
      )}
    </section>
  );
}
