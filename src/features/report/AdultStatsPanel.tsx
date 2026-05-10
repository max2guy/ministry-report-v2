import type { DepartmentReport, MinistryReport } from "../../domain/reportTypes";
import {
  absenceStreakColorClass,
  computeConsecutiveAbsences,
  getMonthlyAbsences,
  getRecentWeeklyAbsences,
  getTotalCount,
} from "./statsUtils";

type Props = {
  dept: DepartmentReport;
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

export function AdultStatsPanel({ dept, reportDate, reports }: Props) {
  const zones = dept.zones ?? [];
  const total = getTotalCount(dept);
  const present = dept.attendance;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const streaks = computeConsecutiveAbsences(reports, "adult", reportDate);
  const weeklyAbsences = getRecentWeeklyAbsences(reports, reportDate, 8);
  const monthlyAbsences = getMonthlyAbsences(reports, reportDate);

  const districts = [...new Set(zones.map((z) => z.district))].sort((a, b) => a - b);
  const hasZoneAbsent = zones.some((z) => z.members.some((m) => m.status === "absent"));
  const maxAbsent = Math.max(...weeklyAbsences.map((w) => w.absent), 1);
  const maxMonthlyAbsent = Math.max(...monthlyAbsences.map((m) => m.avgAbsent), 1);

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

      {hasZoneAbsent && (
        <div className="dstats-section">
          <p className="dstats-section-title">구역별 결석</p>
          {districts.map((d) => {
            const districtZones = zones.filter((z) => z.district === d);
            const districtHasAbsent = districtZones.some((z) =>
              z.members.some((m) => m.status === "absent"),
            );
            if (!districtHasAbsent) return null;
            return (
              <div key={d} className="dstats-district">
                <p className="dstats-district-label">{d}교구</p>
                {districtZones.map((z) => {
                  const absentMembers = z.members.filter((m) => m.status === "absent");
                  if (absentMembers.length === 0) return null;
                  return (
                    <div key={z.id} className="dstats-zone-row">
                      <span className="dstats-zone-name">{z.name}</span>
                      <div className="dstats-pills">
                        {absentMembers.map((m) => {
                          const streak = streaks.find((s) => s.id === m.id)?.streak ?? 1;
                          const cls = streak >= 4 ? "streak-danger" : streak >= 2 ? "streak-warning" : "";
                          return (
                            <span key={m.id} className={`dstats-absent-pill ${cls}`}>
                              {m.name}
                            </span>
                          );
                        })}
                      </div>
                      <span className="dstats-zone-count">{absentMembers.length}명</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
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

      {weeklyAbsences.length > 1 && (
        <div className="dstats-section">
          <p className="dstats-section-title">📊 최근 8주 결석 추이</p>
          <div className="dstats-bars">
            {weeklyAbsences.map((w) => (
              <div key={w.date} className="dstats-bar-row">
                <span className="dstats-bar-label">{w.date.slice(5).replace("-", "/")}</span>
                <MiniBar value={w.absent} max={maxAbsent} label={`${w.absent}명`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyAbsences.length > 0 && (
        <div className="dstats-section">
          <p className="dstats-section-title">📅 월별 결석 분석</p>
          <div className="dstats-bars">
            {monthlyAbsences.map((m) => (
              <div key={m.label} className="dstats-bar-row">
                <span className="dstats-bar-label">{m.label.replace(/^\d{2}년 /, "")}</span>
                <MiniBar value={m.avgAbsent} max={maxMonthlyAbsent} label={`주평균 ${m.avgAbsent}명`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
