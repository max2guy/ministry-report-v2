import type { MinistryReport } from "./reportTypes";

export type MinistryReportBackup = {
  schemaVersion: 2;
  exportedAt: string;
  reports: MinistryReport[];
};

export function createReportBackup(
  reports: MinistryReport[],
  now = new Date(),
): MinistryReportBackup {
  return {
    schemaVersion: 2,
    exportedAt: now.toISOString(),
    reports,
  };
}
