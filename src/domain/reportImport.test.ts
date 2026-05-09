import { describe, expect, it, vi } from "vitest";
import { parseReportImport } from "./reportImport";

describe("parseReportImport", () => {
  it("imports member cards from a v2 report", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fallback-id" });

    const [result] = parseReportImport(
      {
        schemaVersion: 2,
        id: "report-v2-member-cards",
        title: "카드형 보고",
        reportDate: "2026-05-03",
        departments: {
          elementary: {
            members: [
              { id: "member-1", name: "권상우", status: "present" },
              { id: "member-2", name: "천주아", status: "absent" },
            ],
          },
        },
      },
      new Date("2026-05-07T00:00:00.000Z"),
    );

    expect(result.report.churchName).toBe("연천장로교회");
    expect(result.report.departments.elementary.members).toEqual([
      { id: "member-1", name: "권상우", status: "present" },
      { id: "member-2", name: "천주아", status: "absent" },
    ]);
    expect(result.report.departments.elementary.attendance).toBe(1);
  });

  it("imports a v2 backup bundle as multiple reports", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fallback-id" });

    const results = parseReportImport(
      {
        schemaVersion: 2,
        exportedAt: "2026-05-01T00:00:00.000Z",
        reports: [
          {
            schemaVersion: 2,
            id: "report-v2-1",
            title: "유초등부 백업 보고",
            reportDate: "2026-04-19",
            departments: {
              elementary: { attendance: 10, summary: "복원 테스트" },
            },
          },
          {
            schemaVersion: 2,
            id: "report-v2-2",
            title: "청년부 백업 보고",
            reportDate: "2026-04-26",
            departments: {
              youngAdult: { attendance: 14 },
            },
          },
        ],
      },
      new Date("2026-05-01T00:00:00.000Z"),
    );

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.report.id)).toEqual([
      "report-v2-1",
      "report-v2-2",
    ]);
    expect(results[0].report.departments.elementary).toMatchObject({
      key: "elementary",
      name: "유초등부",
      attendance: 10,
      summary: "복원 테스트",
    });
    expect(results[1].report.departments.youngAdult.attendance).toBe(14);
    expect(results.flatMap((result) => result.warnings)).toEqual([]);
  });
});
