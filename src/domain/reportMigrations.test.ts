import { describe, expect, it, vi } from "vitest";
import { migrateLegacyReport, migrateLegacyReports } from "./reportMigrations";

describe("migrateLegacyReport", () => {
  it("preserves generic legacy report fields in v2 format", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "report-1" });

    const result = migrateLegacyReport(
      {
        title: "4월 사역보고",
        date: "2026-04-26",
        churchName: "샘플교회",
        pastorName: "김목사",
        attendance: { adult: 80, youth: 12, children: 9, youngAdult: 30 },
        offerings: { total: 1200000, memo: "주일 헌금" },
        prayerRequests: ["환우를 위해"],
        announcements: ["5월 행사 준비"],
      },
      new Date("2026-04-30T00:00:00.000Z"),
    );

    expect(result.report).toMatchObject({
      schemaVersion: 2,
      id: "report-1",
      title: "4월 사역보고",
      reportDate: "2026-04-26",
      churchName: "샘플교회",
      departments: {
        elementary: { name: "유초등부", attendance: 9 },
        middleHigh: { name: "중고등부", attendance: 12 },
        youngAdult: { name: "청년부", attendance: 30 },
        adult: { name: "장년", attendance: 80 },
      },
    });
    expect(result.warnings).toEqual([]);
  });

  it("maps existing report-app history entries without losing notes", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "history-report-1" });

    const result = migrateLegacyReport(
      {
        date: "2026-04-26",
        youth: {
          present: 7,
          absent: 6,
          total: 13,
          absentNames: ["학생1", "학생2"],
        },
        young: {
          present: 14,
          absent: 4,
          total: 18,
          absentNames: ["청년1"],
        },
        adult: {
          absent: 44,
          zones: [{ zone: "1구역", names: ["성도1", "성도2"] }],
        },
        nextWeekPlan: "다음 주 정상 예배",
        prayer: "결석자들을 위해",
        generalOpinion: "특이사항 없음",
      },
      new Date("2026-04-30T00:00:00.000Z"),
    );

    expect(result.report.reportDate).toBe("2026-04-26");
    expect(result.report.departments.elementary.attendance).toBe(0);
    expect(result.report.departments.middleHigh.attendance).toBe(7);
    expect(result.report.departments.youngAdult.attendance).toBe(14);
    expect(result.report.departments.adult.summary).toContain("결석 44명");
    expect(result.report.departments.adult.summary).toContain("1구역");
    expect(result.report.prayerRequests).toEqual(["결석자들을 위해"]);
    expect(result.report.announcements).toEqual([
      "다음 주 계획: 다음 주 정상 예배",
      "종합 의견: 특이사항 없음",
    ]);
    expect(result.warnings).toEqual([
      "기존 데이터에 유초등부 항목이 없어 빈 부서로 생성했습니다.",
    ]);
  });

  it("does not treat child as a supported elementary alias", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "report-child-alias" });

    const result = migrateLegacyReport(
      {
        date: "2026-04-26",
        departments: {
          child: { attendance: 11, summary: "child 별칭 입력" },
        },
        attendance: {
          child: 12,
        },
      },
      new Date("2026-04-30T00:00:00.000Z"),
    );

    expect(result.report.departments.elementary).toMatchObject({
      key: "elementary",
      name: "유초등부",
      attendance: 0,
      summary: "",
    });
    expect(result.warnings).toEqual([
      "기존 데이터에 유초등부 항목이 없어 빈 부서로 생성했습니다.",
    ]);
  });

  it("migrates a history array", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "report-id" });

    const results = migrateLegacyReports(
      [{ date: "2026-04-19" }, { date: "2026-04-26" }],
      new Date("2026-04-30T00:00:00.000Z"),
    );

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.report.reportDate)).toEqual([
      "2026-04-19",
      "2026-04-26",
    ]);
  });
});
