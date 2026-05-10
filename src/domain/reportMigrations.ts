import type { DepartmentKey, DepartmentReport, MinistryReport } from "./reportTypes";

export type LegacyReportInput = {
  title?: unknown;
  date?: unknown;
  reportDate?: unknown;
  churchName?: unknown;
  pastorName?: unknown;
  reporter?: unknown;
  department?: unknown;
  departments?: unknown;
  attendance?: unknown;
  youth?: unknown;
  young?: unknown;
  adult?: unknown;
  offerings?: unknown;
  prayerRequests?: unknown;
  announcements?: unknown;
  nextWeekPlan?: unknown;
  prayer?: unknown;
  generalOpinion?: unknown;
};

export type MigrationResult = {
  report: MinistryReport;
  warnings: string[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function objectRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function compactList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function withLabel(label: string, value: unknown): string {
  const content = text(value);
  return content ? `${label}: ${content}` : "";
}

function formatAbsentNames(value: unknown): string {
  const names = stringList(value);
  return names.length ? `결석자: ${names.join(", ")}` : "";
}

function formatGroupSummary(group: Record<string, unknown>): string {
  return compactList([
    optionalNumberValue(group.total) === undefined ? "" : `총원 ${numberValue(group.total)}명`,
    optionalNumberValue(group.absent) === undefined
      ? ""
      : `결석 ${numberValue(group.absent)}명`,
    formatAbsentNames(group.absentNames),
    text(group.summary),
    text(group.note),
  ]).join("; ");
}

function formatAdultSummary(adult: Record<string, unknown>): string {
  const zones = Array.isArray(adult.zones) ? adult.zones : [];
  const zoneSummaries = zones
    .map((zone) => {
      const record = objectRecord(zone);
      const zoneName = text(record.zone);
      const names = stringList(record.names);
      return zoneName && names.length ? `${zoneName}: ${names.join(", ")}` : "";
    })
    .filter(Boolean);

  return compactList([
    optionalNumberValue(adult.absent) === undefined
      ? ""
      : `결석 ${numberValue(adult.absent)}명`,
    ...zoneSummaries,
    text(adult.summary),
    text(adult.note),
  ]).join("; ");
}

function departmentReport(input: {
  key: DepartmentKey;
  name: string;
  legacyDepartment: Record<string, unknown>;
  legacyGroup: Record<string, unknown>;
  fallbackAttendance: unknown;
  summary: string;
}): DepartmentReport {
  return {
    key: input.key,
    name: input.name,
    attendance:
      optionalNumberValue(input.legacyDepartment.attendance) ??
      optionalNumberValue(input.legacyGroup.present) ??
      optionalNumberValue(input.legacyGroup.attendance) ??
      numberValue(input.fallbackAttendance),
    newVisitors: numberValue(input.legacyDepartment.newVisitors),
    summary: text(input.legacyDepartment.summary) || input.summary,
  };
}

export function migrateLegacyReport(
  input: LegacyReportInput,
  now = new Date(),
): MigrationResult {
  const iso = now.toISOString();
  const date = text(input.reportDate) || text(input.date) || iso.slice(0, 10);
  const departments = objectRecord(input.departments);
  const attendance = objectRecord(input.attendance);
  const youth = objectRecord(input.youth);
  const young = objectRecord(input.young);
  const adult = objectRecord(input.adult);
  const offerings = objectRecord(input.offerings);
  const warnings: string[] = [];

  if (!departments.elementary && !attendance.children) {
    warnings.push("기존 데이터에 유초등부 항목이 없어 빈 부서로 생성했습니다.");
  }

  return {
    report: {
      schemaVersion: 2,
      id: crypto.randomUUID(),
      title: text(input.title) || "주간 사역보고서",
      reportDate: date,
      churchName: text(input.churchName),
      pastorName: text(input.pastorName) || text(input.reporter),
      departments: {
        elementary: departmentReport({
          key: "elementary",
          name: "유초등부",
          legacyDepartment: objectRecord(departments.elementary),
          legacyGroup: objectRecord(input.departments),
          fallbackAttendance: attendance.children,
          summary: "",
        }),
        middleHigh: departmentReport({
          key: "middleHigh",
          name: "중고등부",
          legacyDepartment: objectRecord(departments.middleHigh),
          legacyGroup: youth,
          fallbackAttendance: attendance.youth,
          summary: formatGroupSummary(youth),
        }),
        youngAdult: departmentReport({
          key: "youngAdult",
          name: "청년부",
          legacyDepartment: objectRecord(departments.youngAdult),
          legacyGroup: young,
          fallbackAttendance: attendance.youngAdult,
          summary: formatGroupSummary(young),
        }),
        adult: departmentReport({
          key: "adult",
          name: "교구",
          legacyDepartment: objectRecord(departments.adult),
          legacyGroup: adult,
          fallbackAttendance: attendance.adult,
          summary: formatAdultSummary(adult),
        }),
      },
      offerings: {
        total: numberValue(offerings.total),
        memo: text(offerings.memo),
      },
      prayerRequests: compactList([
        ...stringList(input.prayerRequests),
        text(input.prayer),
      ]),
      announcements: compactList([
        ...stringList(input.announcements),
        withLabel("다음 주 계획", input.nextWeekPlan),
        withLabel("종합 의견", input.generalOpinion),
      ]),
      createdAt: iso,
      updatedAt: iso,
    },
    warnings,
  };
}

export function migrateLegacyReports(
  inputs: LegacyReportInput[],
  now = new Date(),
): MigrationResult[] {
  return inputs.map((input) => migrateLegacyReport(input, now));
}
