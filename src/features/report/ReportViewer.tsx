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
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const duration = Date.now() - touchStartTime.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // 빠른 스와이프(450ms 미만) + 수평 80px 이상 + 수직보다 수평이 큰 경우만 탭 전환
    if (duration <= 450 && Math.abs(dx) >= 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && activeTabIdx < tabs.length - 1) onTabChange(activeTabIdx + 1);
      if (dx > 0 && activeTabIdx > 0) onTabChange(activeTabIdx - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const activeKey = tabs[activeTabIdx]?.key ?? "summary";

  return (
    <section
      className="report-mode viewer-mode"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 데스크탑 전용 탭 바 (모바일에서는 CSS로 숨김 — 모바일은 헤더 탭 바 사용) */}
      {tabs.length > 1 && (
        <div className="viewer-dept-tabs viewer-dept-tabs--desktop">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              className={`viewer-dept-tab-btn${i === activeTabIdx ? " is-active" : ""}`}
              onClick={() => onTabChange(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {activeKey === "summary" ? (
        <ReportCanvas report={report} />
      ) : activeKey === "adult" ? (
        <AdultStatsPanel
          dept={report.departments.adult}
          reportDate={report.reportDate}
          reports={reports}
          label="교구"
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
