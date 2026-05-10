import {
  type LegacyReportInput,
  type MigrationResult,
  migrateLegacyReport,
} from "./reportMigrations";
import {
  createEmptyReport,
  type DepartmentKey,
  type DepartmentMember,
  type DepartmentMemberRole,
  type DepartmentMemberStatus,
  type DepartmentReport,
  type MinistryReport,
} from "./reportTypes";
import { deriveAttendanceFromMembers } from "./reportMembers";

type V2BackupBundle = {
  schemaVersion: 2;
  reports: unknown[];
};

const DEPARTMENT_NAMES: Record<DepartmentKey, string> = {
  elementary: "유초등부",
  middleHigh: "중고등부",
  youngAdult: "청년부",
  adult: "교구",
};

function objectRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

const VALID_ROLES = new Set<string>(["leader", "inspector", "member"]);

function normalizeMembers(value: unknown): DepartmentMember[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => objectRecord(item))
    .map((member, index): DepartmentMember => {
      const status: DepartmentMemberStatus =
        member.status === "present" ? "present" : "absent";
      const roleRaw = typeof member.role === "string" ? member.role : "";
      const groupRaw = typeof member.group === "string" ? member.group : "";

      return {
        id: text(member.id) || `imported-member-${index + 1}`,
        name: text(member.name),
        status,
        ...(VALID_ROLES.has(roleRaw) && { role: roleRaw as DepartmentMemberRole }),
        ...(groupRaw && { group: groupRaw }),
      };
    })
    .filter((member) => member.name);
}

function isV2Report(value: unknown): boolean {
  const record = objectRecord(value);
  return record.schemaVersion === 2 && Boolean(record.departments);
}

function isV2BackupBundle(value: unknown): value is V2BackupBundle {
  const record = objectRecord(value);
  return record.schemaVersion === 2 && Array.isArray(record.reports);
}

function normalizeZones(value: unknown): DepartmentReport["zones"] {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => objectRecord(item))
    .map((zone, zi) => ({
      id: text(zone.id) || `imported-zone-${zi + 1}`,
      name: text(zone.name) || `${zi + 1}구역`,
      district: typeof zone.district === "number" ? zone.district : 1,
      members: (normalizeMembers(zone.members) ?? []) as DepartmentMember[],
    }))
    .filter((z) => z.members.length > 0 || text(z.name));
}

function normalizeDepartment(
  key: DepartmentKey,
  value: unknown,
): DepartmentReport {
  const department = objectRecord(value);
  const members = normalizeMembers(department.members);

  // 장년 구역: zones 배열 우선 처리
  if (key === "adult" && Array.isArray(department.zones)) {
    const zones = normalizeZones(department.zones);
    const attendance =
      zones?.reduce(
        (sum, z) => sum + z.members.filter((m) => m.status === "present").length,
        0,
      ) ?? numberValue(department.attendance);
    return {
      key,
      name: DEPARTMENT_NAMES[key],
      attendance,
      newVisitors: numberValue(department.newVisitors),
      summary: text(department.summary),
      zones,
    };
  }

  const normalized: DepartmentReport = {
    key,
    name: DEPARTMENT_NAMES[key],
    attendance: numberValue(department.attendance),
    newVisitors: numberValue(department.newVisitors),
    summary: text(department.summary),
    members,
  };

  if (!members) {
    return normalized;
  }

  return {
    ...normalized,
    attendance: deriveAttendanceFromMembers(normalized),
  };
}

function normalizeV2Report(input: unknown, now: Date): MigrationResult {
  const fallback = createEmptyReport(now);
  const record = objectRecord(input);
  const departments = objectRecord(record.departments);

  return {
    report: {
      ...fallback,
      id: text(record.id) || fallback.id,
      title: text(record.title) || fallback.title,
      reportDate: text(record.reportDate) || fallback.reportDate,
      churchName: text(record.churchName) || fallback.churchName,
      pastorName: text(record.pastorName),
      departments: {
        elementary: normalizeDepartment("elementary", departments.elementary),
        middleHigh: normalizeDepartment("middleHigh", departments.middleHigh),
        youngAdult: normalizeDepartment("youngAdult", departments.youngAdult),
        adult: normalizeDepartment("adult", departments.adult),
      },
      offerings: {
        total: numberValue(objectRecord(record.offerings).total),
        memo: text(objectRecord(record.offerings).memo),
      },
      prayerRequests: stringList(record.prayerRequests),
      announcements: stringList(record.announcements),
      createdAt: text(record.createdAt) || fallback.createdAt,
      updatedAt: text(record.updatedAt) || fallback.updatedAt,
    },
    warnings: [],
  };
}

function parseOne(input: unknown, now: Date): MigrationResult {
  return isV2Report(input)
    ? normalizeV2Report(input, now)
    : migrateLegacyReport(input as LegacyReportInput, now);
}

export function parseReportImport(
  input: unknown,
  now = new Date(),
): MigrationResult[] {
  if (Array.isArray(input)) {
    return input.map((item) => parseOne(item, now));
  }

  if (isV2BackupBundle(input)) {
    return input.reports.map((item) => parseOne(item, now));
  }

  return [parseOne(input, now)];
}
