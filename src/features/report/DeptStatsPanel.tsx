import type { DepartmentKey, DepartmentReport, MinistryReport } from "../../domain/reportTypes";
import {
  absenceStreakColorClass,
  computeConsecutiveAbsences,
  getAbsentMembers,
  getMonthlyRates,
  getRecentWeeklyRates,
  getTotalCount,
} from "./statsUtils";

type Props = {
  dept: DepartmentReport;
  deptKey: DepartmentKey;
  reportDate: string;
  reports: MinistryReport[];
};

function rateBadgeClass(rate: number): string {
  if (rate >= 70) return "rate-good";
  if (rate >= 50) return "rate-mid";
  return "rate-low";
}

function MiniBar({
  value, max, label, colorClass = "sbar-primary",
}: {
  value: number; max: number; label?: string; colorClass?: string;
}) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="dstats-sbar-track">
      <div className={`sbar-fill ${colorClass}`} style={{ width: `${pct}%` }}>
        {label && pct > 14 && <span className="sbar-fill-label">{label}</span>}
      </div>
    </div>
  );
}

export function DeptStatsPanel({ dept, deptKey, reportDate, reports }: Props) {
  const total = getTotalCount(dept);
  const present = dept.attendance;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const absentMembers = getAbsentMembers(dept);
  const streaks = computeConsecutiveAbsences(reports, deptKey, reportDate);
  const weeklyRates = getRecentWeeklyRates(reports, deptKey, reportDate, 8);
  const monthlyRates = getMonthlyRates(reports, deptKey, reportDate);

  return (
    <div className="dstats-panel">
      <div className="dstats-header">
        <span className="dstats-name">{dept.name}</span>
        <span className={`dstats-rate-badge ${rateBadgeClass(rate)}`}>출석률 {rate}%</span>
      </div>
      <div className="dstats-date">📅 {reportDate}</div>

      <div className="dstats-counts">
        <div className="dstats-count-item">
          <span className="dstats-count-num dstats-present">
            {present}<em className="dstats-count-unit">명</em>
          </span>
          <span className="dstats-count-label">출석</span>
        </div>
        <div className="dstats-count-divider" />
        <div className="dstats-count-item">
          <span className="dstats-count-num dstats-absent">
            {absent}<em className="dstats-count-unit">명</em>
          </span>
          <span className="dstats-count-label">결석</span>
        </div>
        <div className="dstats-count-divider" />
        <div className="dstats-count-item">
          <span className="dstats-count-num">
            {total}<em className="dstats-count-unit">명</em>
          </span>
          <span className="dstats-count-label">전체</span>
        </div>
      </div>

      {absentMembers.length > 0 && (
        <div className="dstats-section">
          <p className="dstats-section-title">결석자</p>
          <div className="dstats-pills">
            {absentMembers.map((m) => (
              <span key={m.id} className="dstats-absent-pill">{m.name}</span>
            ))}
          </div>
        </div>
      )}

      {streaks.length > 0 && (
        <div className="dstats-section">
          <p className="dstats-section-title">🔴 연속결석</p>
          <div className="dstats-pills">
            {streaks.map((s) => (
              <span key={s.id} className="dstats-streak-item">
                {s.name}
                <span className={`dstats-streak-badge ${absenceStreakColorClass(s.streak)}`}>
                  {s.streak}주
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {weeklyRates.length > 1 && (
        <div className="dstats-section">
          <p className="dstats-section-title">📊 최근 8주 추이</p>
          <div className="dstats-bars">
            {weeklyRates.map((w) => (
              <div key={w.date} className="dstats-bar-row">
                <span className="dstats-bar-label">{w.date.slice(5).replace("-", "/")}</span>
                <MiniBar value={w.rate} max={100} label={`${w.rate}%`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyRates.length > 0 && (
        <div className="dstats-section">
          <p className="dstats-section-title">📅 월별 평균</p>
          <div className="dstats-bars">
            {monthlyRates.map((m) => (
              <div key={m.label} className="dstats-bar-row">
                <span className="dstats-bar-label">{m.label.replace(/^\d{2}년 /, "")}</span>
                <MiniBar value={m.rate} max={100} label={`${m.rate}%`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
