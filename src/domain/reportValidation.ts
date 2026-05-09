import type { MinistryReport } from "./reportTypes";

export function validateReportForSave(report: MinistryReport): string[] {
  const errors: string[] = [];

  if (!report.title.trim()) errors.push("제목을 입력해 주세요.");
  if (!report.reportDate.trim()) errors.push("보고일을 선택해 주세요.");
  if (!report.pastorName.trim()) errors.push("보고자를 입력해 주세요.");

  return errors;
}
