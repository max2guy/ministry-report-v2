import type { MinistryReport } from "../domain/reportTypes";

const DRAFT_KEY = "ministry-report-v2-current-draft";

function isReportDraft(value: unknown): value is MinistryReport {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === 2 &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

export function readReportDraft(): MinistryReport | undefined {
  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (!rawDraft) return undefined;

  try {
    const parsed = JSON.parse(rawDraft);
    return isReportDraft(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveReportDraft(report: MinistryReport): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(report));
}
