import { describe, expect, it } from "vitest";
import { createEmptyReport } from "./reportTypes";
import { validateReportForSave } from "./reportValidation";

describe("validateReportForSave", () => {
  it("requires title, report date, and reporter name", () => {
    const report = {
      ...createEmptyReport(new Date("2026-05-01T00:00:00.000Z")),
      title: " ",
      reportDate: "",
      pastorName: "",
    };

    expect(validateReportForSave(report)).toEqual([
      "제목을 입력해 주세요.",
      "보고일을 선택해 주세요.",
      "보고자를 입력해 주세요.",
    ]);
  });

  it("accepts a report with required fields", () => {
    const report = {
      ...createEmptyReport(new Date("2026-05-01T00:00:00.000Z")),
      title: "5월 첫째 주 보고",
      pastorName: "김우중",
    };

    expect(validateReportForSave(report)).toEqual([]);
  });
});
