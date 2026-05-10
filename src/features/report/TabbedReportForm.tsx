import { useRef, useState } from "react";
import { hasMemberCards, hasZones } from "../../domain/reportMembers";
import type {
  DepartmentKey,
  DepartmentReport,
  MinistryReport,
} from "../../domain/reportTypes";
import { AttendanceSummaryStats } from "./AttendanceSummaryStats";
import { DepartmentAttendanceEditor } from "./DepartmentAttendanceEditor";
import { LegacyDepartmentAttendanceEditor } from "./LegacyDepartmentAttendanceEditor";
import { ReportCanvas } from "./ReportCanvas";

type TabKey =
  | "info"
  | "elementary"
  | "middleHigh"
  | "youngAdult"
  | "adult"
  | "prayer";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "기본정보" },
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
  { key: "prayer", label: "기도·광고" },
];

const DEPT_TABS: { key: DepartmentKey }[] = [
  { key: "elementary" },
  { key: "middleHigh" },
  { key: "youngAdult" },
  { key: "adult" },
];

// UI 라벨 맵 (도메인 name 대신 표시)
const TAB_LABEL: Record<string, string> = Object.fromEntries(
  TABS.map((t) => [t.key, t.label]),
);

type Props = {
  report: MinistryReport;
  reports: MinistryReport[];
  onChange: (report: MinistryReport) => void;
};

function textAreaToList(value: string): string[] {
  return value.split("\n").filter(line => line.trim().length > 0);
}

function listToText(value: string[]): string {
  return value.join("\n");
}

export function TabbedReportForm({ report, reports, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    const btn = tabRefs.current[key];
    btn?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }

  function updateReport(patch: Partial<MinistryReport>) {
    const now = new Date().toISOString();
    onChange({ ...report, ...patch, updatedAt: now });
  }

  function updateDepartment(
    key: DepartmentKey,
    patch: Partial<DepartmentReport>,
  ) {
    updateReport({
      departments: {
        ...report.departments,
        [key]: { ...report.departments[key], ...patch },
      },
    });
  }

  return (
    <div className="tabbed-report-form">
      <div className="report-tab-bar" role="tablist" aria-label="보고서 섹션">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[tab.key] = el; }}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`report-tab-btn${activeTab === tab.key ? " is-active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 기본정보 탭 */}
      <div
        className="report-tab-panel"
        role="tabpanel"
        hidden={activeTab !== "info"}
      >
        <div className="info-row">
          <label>
            제목
            <input
              value={report.title}
              onChange={(e) => updateReport({ title: e.currentTarget.value })}
            />
          </label>
          <label>
            보고일
            <input
              type="date"
              value={report.reportDate}
              onChange={(e) =>
                updateReport({ reportDate: e.currentTarget.value })
              }
            />
          </label>
          <label>
            보고자
            <input
              value={report.pastorName}
              onChange={(e) =>
                updateReport({ pastorName: e.currentTarget.value })
              }
            />
          </label>
        </div>
        <AttendanceSummaryStats reports={reports} currentYear={currentYear} />
        <ReportCanvas report={report} />
      </div>

      {/* 부서 탭 (유초등부·중고등부·청년부·교구) */}
      {DEPT_TABS.map(({ key }) => {
        const department = report.departments[key];
        return (
          <div
            key={key}
            className="report-tab-panel"
            role="tabpanel"
            hidden={activeTab !== key}
          >
            <section className="department-edit">
              <h3>{TAB_LABEL[key] ?? department.name}</h3>
              {hasMemberCards(department) || hasZones(department) ? (
                <>
                  <DepartmentAttendanceEditor
                    department={department}
                    reportDate={report.reportDate}
                    onChange={(nextKey, nextDept) =>
                      updateDepartment(nextKey, nextDept)
                    }
                  />
                  <label>
                    새가족
                    <input
                      min="0"
                      type="number"
                      value={
                        department.newVisitors === 0
                          ? ""
                          : String(department.newVisitors)
                      }
                      onChange={(e) =>
                        updateDepartment(key, {
                          newVisitors: Number(e.currentTarget.value) || 0,
                        })
                      }
                    />
                  </label>
                </>
              ) : (
                <LegacyDepartmentAttendanceEditor
                  department={department}
                  onChange={updateDepartment}
                />
              )}
              <label>
                요약
                <textarea
                  rows={3}
                  value={department.summary}
                  onChange={(e) =>
                    updateDepartment(key, { summary: e.currentTarget.value })
                  }
                />
              </label>
            </section>
          </div>
        );
      })}

      {/* 기도·광고 탭 */}
      <div
        className="report-tab-panel"
        role="tabpanel"
        hidden={activeTab !== "prayer"}
      >
        <div className="prayer-section">
          <label>
            기도제목
            <textarea
              rows={4}
              value={listToText(report.prayerRequests)}
              onChange={(e) =>
                updateReport({
                  prayerRequests: textAreaToList(e.currentTarget.value),
                })
              }
            />
          </label>
          <label>
            광고 / 다음 계획
            <textarea
              rows={4}
              value={listToText(report.announcements)}
              onChange={(e) =>
                updateReport({
                  announcements: textAreaToList(e.currentTarget.value),
                })
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}
