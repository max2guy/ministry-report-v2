import { describe, expect, it, vi } from "vitest";
import {
  cloneReportAsDraft,
  createEmptyReport,
  upgradeReportForEditor,
} from "./reportTypes";

describe("createEmptyReport", () => {
  it("creates a versioned v2 report", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "seed-id" });
    const report = createEmptyReport(new Date("2026-04-30T00:00:00.000Z"));

    expect(report.schemaVersion).toBe(2);
    expect(report.reportDate).toBe("2026-04-30");
    expect(report.churchName).toBe("연천장로교회");
    expect(report.departments.elementary.name).toBe("유초등부");
    expect(report.departments.middleHigh.name).toBe("중고등부");
    expect(report.departments.youngAdult.name).toBe("청년부");
    expect(report.departments.adult.name).toBe("교구");
    expect(report.departments.elementary.members?.map((member) => member.name)).toEqual([
      "권상우",
      "천주아",
    ]);
    expect(
      report.departments.elementary.members?.every(
        (member) => member.status === "absent",
      ),
    ).toBe(true);
    expect(report.departments.elementary.attendance).toBe(0);
  });

  it("copies an existing report as a fresh draft", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "copied-report-id" });
    const source = {
      ...createEmptyReport(new Date("2026-04-19T00:00:00.000Z")),
      id: "source-report-id",
      title: "유초등부 예배 보고",
      reportDate: "2026-04-19",
      departments: {
        ...createEmptyReport(new Date("2026-04-19T00:00:00.000Z")).departments,
        elementary: {
          key: "elementary" as const,
          name: "유초등부",
          attendance: 12,
          newVisitors: 1,
          summary: "복사할 요약",
          members: [{ id: "member-1", name: "권상우", status: "present" as const }],
        },
      },
    };

    const draft = cloneReportAsDraft(
      source,
      new Date("2026-05-01T00:00:00.000Z"),
    );

    expect(draft).toMatchObject({
      id: "copied-report-id",
      title: "유초등부 예배 보고 복사본",
      reportDate: "2026-05-01",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      departments: {
        elementary: {
          attendance: 12,
          newVisitors: 1,
          summary: "복사할 요약",
          members: [{ id: "member-1", name: "권상우", status: "present" }],
        },
      },
    });
    expect(draft.departments.elementary.members).not.toBe(
      source.departments.elementary.members,
    );
  });

  it("upgrades empty legacy departments to card mode for editing", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "upgrade-id" });

    const upgraded = upgradeReportForEditor({
      ...createEmptyReport(new Date("2026-04-30T00:00:00.000Z")),
      departments: {
        elementary: {
          key: "elementary",
          name: "유초등부",
          attendance: 0,
          newVisitors: 0,
          summary: "",
        },
        middleHigh: {
          key: "middleHigh",
          name: "중고등부",
          attendance: 0,
          newVisitors: 0,
          summary: "",
        },
        youngAdult: {
          key: "youngAdult",
          name: "청년부",
          attendance: 0,
          newVisitors: 0,
          summary: "",
        },
        adult: {
          key: "adult",
          name: "교구",
          attendance: 0,
          newVisitors: 0,
          summary: "",
        },
      },
    });

    expect(upgraded.departments.elementary.members?.map((m) => m.name)).toEqual([
      "권상우", "천주아",
    ]);
    expect(upgraded.departments.middleHigh.members?.map((m) => m.name)).toEqual([
      "김규인", "김주영", "김주혁", "이예진", "이태양",
      "이호석", "정서원", "정시원", "정소원",
      "김주찬", "변아영", "변현섭", "최우진",
    ]);
    expect(upgraded.departments.youngAdult.members?.map((m) => m.name)).toEqual([
      "고현아", "김보은", "김정인", "김주은", "김태양",
      "라규미", "박시은", "신승환", "안수용", "유다희",
      "유세희", "이석준", "정은정", "정혜정", "차예담",
      "한상희", "한혜원", "황원영",
    ]);
    expect(upgraded.departments.adult.members).toBeUndefined();
    expect(upgraded.departments.adult.zones).toBeUndefined();
    expect(upgraded.departments.adult.attendance).toBe(0);
  });
});
