import { useState, useRef } from "react";
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";
import { AdultStatsPanel } from "./AdultStatsPanel";
import { ReportCanvas } from "./ReportCanvas";
import { DeptStatsPanel } from "./DeptStatsPanel";

type ReportViewerProps = {
  report: MinistryReport;
  reports: MinistryReport[];
};

type DeptTab = {
  key: DepartmentKey;
  label: string;
};

const FLAT_DEPT_DEFS: { key: "elementary" | "middleHigh" | "youngAdult"; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
];

export function ReportViewer({ report, reports }: ReportViewerProps) {
  const tabs: DeptTab[] = [];
  for (const { key, label } of FLAT_DEPT_DEFS) {
    if ((report.departments[key].members?.length ?? 0) > 0) {
      tabs.push({ key, label });
    }
  }
  if ((report.departments.adult.zones?.length ?? 0) > 0) {
    tabs.push({ key: "adult", label: "장년" });
  }

  const hasStats = tabs.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && activeIdx < tabs.length - 1) setActiveIdx((i) => i + 1);
      if (dx > 0 && activeIdx > 0) setActiveIdx((i) => i - 1);
    }
    touchStartX.current = null;
  }

  const activeTab = tabs[activeIdx];

  return (
    <section className="report-mode viewer-mode">
      <ReportCanvas report={report} />

      {hasStats && (
        <div className="viewer-stats">
          {/* 부서 탭 바 */}
          <div className="viewer-dept-tabs">
            {tabs.map((tab, i) => (
              <button
                key={tab.key}
                type="button"
                className={`viewer-dept-tab-btn${i === activeIdx ? " is-active" : ""}`}
                onClick={() => setActiveIdx(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 부서별 통계 패널 (스와이프 가능) */}
          <div
            className="viewer-stats-pane"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {activeTab?.key === "adult" ? (
              <AdultStatsPanel
                dept={report.departments.adult}
                reportDate={report.reportDate}
                reports={reports}
              />
            ) : activeTab ? (
              <DeptStatsPanel
                dept={report.departments[activeTab.key]}
                deptKey={activeTab.key}
                reportDate={report.reportDate}
                reports={reports}
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
