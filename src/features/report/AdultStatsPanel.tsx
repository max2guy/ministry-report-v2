import type { DepartmentReport, MinistryReport } from "../../domain/reportTypes";
import {
  absenceStreakColorClass,
  computeConsecutiveAbsences,
  getMonthlyRates,
  getRecentWeeklyRates,
  getTotalCount,
} from "./statsUtils";


type Props = {
  dept: DepartmentReport;
  reportDate: string;
  reports: MinistryReport[];
};

function absenceColorClass(attendanceRate: number): string {
  const absent = 100 - attendanceRate;
  if (absent >= 40) return "sbar-absence-high";
  if (absent >= 20) return "sbar-absence-mid";
  return "sbar-absence-low";
}

function MiniBar({ value, max, colorClass = "sbar-primary" }: { value: number; max: number; colorClass?: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className={`dstats-sbar-track ${colorClass}`}>
      <div className="sbar-empty" style={{ width: `${100 - pct}%` }} />
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
  const weeklyRates = getRecentWeeklyRates(reports, "adult", reportDate, 8);
  const monthlyRates = getMonthlyRates(reports, "adult", reportDate);

  // Group zones by district number
  const districts = [...new Set(zones.map((z) => z.district))].sort((a, b) => a - b);

  const hasZoneAbsent = zones.some((z) => z.members.some((m) => m.status === "absent"));

  return (
    <div className="dstats-panel">
      <div className="dstats-header">
        <span className="dstats-name">{dept.name}</span>
        <span className="dstats-date">{reportDate}</span>
      </div>

      <div className="dstats-hero">
        <span className="dstats-hero-value">{rate}%</span>
        <span className="dstats-hero-label">출석률</span>
      </div>

      <div className="dstats-counts">
        <div className="dstats-count-item">
          <span className="dstats-count-num dstats-present">{present}</span>
          <span className="dstats-count-label">출석</span>
        </div>
        <div className="dstats-count-item">
          <span className="dstats-count-num dstats-absent">{absent}</span>
          <span className="dstats-count-label">결석</span>
        </div>
        <div className="dstats-count-item">
          <span className="dstats-count-num">{total}</span>
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
                          return (
                            <span key={m.id} className={`dstats-pill ${absenceStreakColorClass(streak)}`}>
                              {m.name}
                            </span>
                          );
                        })}
                      </div>
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
          <p className="dstats-section-title">연속결석</p>
          <div className="dstats-pills">
            {streaks.map((s) => (
              <span
                key={s.id}
                className={`dstats-streak-pill ${absenceStreakColorClass(s.streak)}`}
              >
                {s.name} <strong>{s.streak}주</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {weeklyRates.length > 1 && (
        <div className="dstats-section">
          <p className="dstats-section-title">최근 8주 추이</p>
          <div className="dstats-bars">
            {weeklyRates.map((w) => (
              <div key={w.date} className="dstats-bar-row">
                <span className="dstats-bar-label">
                  {w.date.slice(5).replace("-", "/")}
                </span>
                <MiniBar value={w.rate} max={100} colorClass={absenceColorClass(w.rate)} />
                <span className="dstats-bar-val">{w.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyRates.length > 0 && (
        <div className="dstats-section">
          <p className="dstats-section-title">월별 평균</p>
          <div className="dstats-bars">
            {monthlyRates.map((m) => (
              <div key={m.label} className="dstats-bar-row">
                <span className="dstats-bar-label">{m.label}</span>
                <MiniBar value={m.rate} max={100} />
                <span className="dstats-bar-val">
                  {m.avgPresent}/{m.avgTotal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
