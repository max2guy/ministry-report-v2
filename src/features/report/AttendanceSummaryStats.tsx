import { useState } from "react";
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";

type StatDept = "elementary" | "middleHigh" | "youngAdult" | "adult";
type ViewMode = "monthly" | "annual";

const STAT_DEPTS: { key: StatDept; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult",      label: "교구" },
];

function getTotal(r: MinistryReport, key: DepartmentKey): number {
  const dept = r.departments[key];
  if (dept.zones)   return dept.zones.reduce((s, z) => s + z.members.length, 0);
  if (dept.members) return dept.members.length;
  return 0;
}

function round1(n: number) { return Math.round(n * 10) / 10; }

interface RowData {
  label: string;
  barWidth: number;      // 0~100 (%)
  colorClass: string;
  mainValue: string;
  subLine1: string;
  subLine2?: string;
}


/** 중고등부·청년부용: 출석률 + 평균 인원 */
function buildAttendanceRows(
  reports: MinistryReport[],
  key: StatDept,
  groupBy: "month" | "year",
): RowData[] {
  const map = new Map<number, MinistryReport[]>();
  for (const r of reports) {
    const k = groupBy === "month"
      ? parseInt(r.reportDate.slice(5, 7))
      : parseInt(r.reportDate.slice(0, 4));
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, rs]) => {
      const totals   = rs.map(r => getTotal(r, key));
      const presents = rs.map(r => r.departments[key].attendance);
      const avgTotal   = round1(totals.reduce((a, b) => a + b, 0)   / rs.length);
      const avgPresent = round1(presents.reduce((a, b) => a + b, 0) / rs.length);
      const rates = rs
        .map((r, i) => totals[i] > 0 ? (presents[i] / totals[i]) * 100 : null)
        .filter((v): v is number => v !== null);
      const rate = rates.length ? round1(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
      const label = groupBy === "month" ? `${k}월` : `${String(k).slice(2)}년`;
      return {
        label,
        barWidth: Math.min(rate, 100),
        colorClass: "sbar-primary",
        mainValue: `${Math.round(rate)}%`,
        subLine1: "평균",
        subLine2: `${Math.round(avgPresent)}/${Math.round(avgTotal)}명`,
      };
    });
}

/** 교구용: 주평균 결석 인원 */


function StatBar({ width, colorClass }: { width: number; colorClass: string }) {
  return (
    <div className={`sbar-track ${colorClass}`}>
      {/* right-side overlay hides the "empty" portion of the gradient */}
      <div className="sbar-empty" style={{ width: `${100 - width}%` }} />
    </div>
  );
}

function StatRow({ row }: { row: RowData }) {
  return (
    <div className="srow">
      <span className="srow-label">{row.label}</span>
      <StatBar width={row.barWidth} colorClass={row.colorClass} />
      <span className="srow-main">{row.mainValue}</span>
      <span className="srow-sub">
        {row.subLine1}
        {row.subLine2 && <><br />{row.subLine2}</>}
      </span>
    </div>
  );
}

type Props = { reports: MinistryReport[]; currentYear: number };

export function AttendanceSummaryStats({ reports, currentYear }: Props) {
  const [activeDept, setActiveDept] = useState<StatDept>("elementary");
  const [activeView, setActiveView] = useState<ViewMode>("monthly");

  if (reports.length === 0) {
    return (
      <section className="stat-section">
        <h3 className="stat-section-title">출결 통계</h3>
        <p className="attendance-summary-empty">저장된 보고서가 없습니다.</p>
      </section>
    );
  }

  const groupBy = activeView === "monthly" ? "month" : "year";
  const rows: RowData[] = buildAttendanceRows(reports, activeDept, groupBy);

  // 월별 모드: 연도별로 그룹화
  interface YearGroup { year: number; rows: RowData[] }
  let yearGroups: YearGroup[] = [];

  if (activeView === "monthly") {
    const yearMap = new Map<number, MinistryReport[]>();
    for (const r of reports) {
      const y = parseInt(r.reportDate.slice(0, 4));
      yearMap.set(y, [...(yearMap.get(y) ?? []), r]);
    }
    yearGroups = [...yearMap.keys()].sort().map(year => {
      const rs = yearMap.get(year)!;
      const built = buildAttendanceRows(rs, activeDept, "month");
      return { year, rows: built };
    });
  }

  return (
    <section className="stat-section">
      <h3 className="stat-section-title">출결 통계</h3>

      <div className="stat-tabs-row">
        <div className="stat-tabs-left">
          {STAT_DEPTS.map(d => (
            <button
              key={d.key}
              type="button"
              className={`stat-tab ${activeDept === d.key ? "stat-tab-active" : ""}`}
              onClick={() => setActiveDept(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="stat-tabs-right">
          {(["monthly", "annual"] as ViewMode[]).map(v => (
            <button
              key={v}
              type="button"
              className={`stat-tab ${activeView === v ? "stat-tab-active" : ""}`}
              onClick={() => setActiveView(v)}
            >
              {v === "monthly" ? "월별" : "연간"}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-body">
        {activeView === "annual" && (
          <div>
            <p className="stat-year-label">연도별 평균 출결률</p>
            {rows.map(row => <StatRow key={row.label} row={row} />)}
          </div>
        )}
        {activeView === "monthly" && yearGroups.map(({ year, rows: yrows }) => (
          <div key={year}>
            <p className="stat-year-label">{year}년</p>
            {yrows.map(row => <StatRow key={row.label} row={row} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
