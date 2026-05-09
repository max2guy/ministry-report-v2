import type {
  DepartmentKey,
  DepartmentMember,
  DepartmentReport,
  MinistryReport,
} from "../../domain/reportTypes";

export function getAllMembers(dept: DepartmentReport): DepartmentMember[] {
  if (dept.members) return dept.members;
  if (dept.zones) return dept.zones.flatMap((z) => z.members);
  return [];
}

export function getAbsentMembers(dept: DepartmentReport): DepartmentMember[] {
  return getAllMembers(dept).filter((m) => m.status === "absent");
}

export function getTotalCount(dept: DepartmentReport): number {
  return getAllMembers(dept).length;
}

/** Consecutive absence streak for each absent member in the report at `currentDate` */
export function computeConsecutiveAbsences(
  reports: MinistryReport[],
  deptKey: DepartmentKey,
  currentDate: string,
): Array<{ id: string; name: string; streak: number }> {
  const sorted = [...reports]
    .filter((r) => r.reportDate <= currentDate)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  if (sorted.length === 0) return [];

  const currentDept = sorted[0].departments[deptKey];
  const absentNow = getAbsentMembers(currentDept);

  return absentNow.map((member) => {
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prevMembers = getAllMembers(sorted[i].departments[deptKey]);
      const found = prevMembers.find((m) => m.id === member.id);
      if (!found) continue; // not in roster for this report — skip
      if (found.status === "absent") {
        streak++;
      } else {
        break;
      }
    }
    return { id: member.id, name: member.name, streak };
  });
}

export function absenceStreakColorClass(streak: number): string {
  if (streak >= 4) return "streak-danger";
  if (streak >= 2) return "streak-warning";
  return "streak-normal";
}

// ── Weekly attendance rate ──────────────────────────────────────

export interface WeeklyRate {
  date: string;
  rate: number; // 0–100
  present: number;
  total: number;
}

export function getRecentWeeklyRates(
  reports: MinistryReport[],
  deptKey: DepartmentKey,
  currentDate: string,
  weeks = 8,
): WeeklyRate[] {
  return [...reports]
    .filter((r) => r.reportDate <= currentDate)
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
    .slice(-weeks)
    .map((r) => {
      const dept = r.departments[deptKey];
      const total = getTotalCount(dept);
      const present = dept.attendance;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { date: r.reportDate, rate, present, total };
    });
}

// ── Monthly average attendance rate ────────────────────────────

export interface MonthlyRate {
  label: string;
  rate: number;
  avgPresent: number;
  avgTotal: number;
}

export function getMonthlyRates(
  reports: MinistryReport[],
  deptKey: DepartmentKey,
  currentDate: string,
): MonthlyRate[] {
  const map = new Map<string, MinistryReport[]>();
  for (const r of reports.filter((r) => r.reportDate <= currentDate)) {
    const ym = r.reportDate.slice(0, 7);
    map.set(ym, [...(map.get(ym) ?? []), r]);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, rs]) => {
      const totals = rs.map((r) => getTotalCount(r.departments[deptKey]));
      const presents = rs.map((r) => r.departments[deptKey].attendance);
      const avgTotal = totals.reduce((a, b) => a + b, 0) / rs.length;
      const avgPresent = presents.reduce((a, b) => a + b, 0) / rs.length;
      const rates = rs
        .map((_, i) => (totals[i] > 0 ? (presents[i] / totals[i]) * 100 : null))
        .filter((v): v is number => v !== null);
      const rate = rates.length
        ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        : 0;
      const year = ym.slice(2, 4);
      const month = parseInt(ym.slice(5, 7));
      return {
        label: `${year}년 ${month}월`,
        rate,
        avgPresent: Math.round(avgPresent),
        avgTotal: Math.round(avgTotal),
      };
    });
}

// ── Adult: weekly absence count ─────────────────────────────────

export interface WeeklyAbsence {
  date: string;
  absent: number;
  total: number;
}

export function getRecentWeeklyAbsences(
  reports: MinistryReport[],
  currentDate: string,
  weeks = 8,
): WeeklyAbsence[] {
  return [...reports]
    .filter((r) => r.reportDate <= currentDate)
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
    .slice(-weeks)
    .map((r) => {
      const dept = r.departments.adult;
      const total = getTotalCount(dept);
      const absent = total - dept.attendance;
      return { date: r.reportDate, absent, total };
    });
}

// ── Adult: monthly average absence ─────────────────────────────

export interface MonthlyAbsence {
  label: string;
  avgAbsent: number;
  avgTotal: number;
}

export function getMonthlyAbsences(
  reports: MinistryReport[],
  currentDate: string,
): MonthlyAbsence[] {
  const map = new Map<string, MinistryReport[]>();
  for (const r of reports.filter((r) => r.reportDate <= currentDate)) {
    const ym = r.reportDate.slice(0, 7);
    map.set(ym, [...(map.get(ym) ?? []), r]);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, rs]) => {
      const totals = rs.map((r) => getTotalCount(r.departments.adult));
      const absents = rs.map((r, i) => totals[i] - r.departments.adult.attendance);
      const avgAbsent = absents.reduce((a, b) => a + b, 0) / rs.length;
      const avgTotal = totals.reduce((a, b) => a + b, 0) / rs.length;
      const year = ym.slice(2, 4);
      const month = parseInt(ym.slice(5, 7));
      return {
        label: `${year}년 ${month}월`,
        avgAbsent: Math.round(avgAbsent),
        avgTotal: Math.round(avgTotal),
      };
    });
}
