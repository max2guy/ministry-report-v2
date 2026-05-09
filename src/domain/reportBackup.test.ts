import { describe, expect, it } from "vitest";
import { createReportBackup } from "./reportBackup";
import { createEmptyReport } from "./reportTypes";

describe("createReportBackup", () => {
  it("wraps saved reports in a v2 backup bundle", () => {
    const firstReport = {
      ...createEmptyReport(new Date("2026-04-19T00:00:00.000Z")),
      id: "backup-1",
      title: "유초등부 보고",
    };
    const secondReport = {
      ...createEmptyReport(new Date("2026-04-26T00:00:00.000Z")),
      id: "backup-2",
      title: "청년부 보고",
    };

    const backup = createReportBackup(
      [firstReport, secondReport],
      new Date("2026-05-01T00:00:00.000Z"),
    );

    expect(backup).toMatchObject({
      schemaVersion: 2,
      exportedAt: "2026-05-01T00:00:00.000Z",
      reports: [
        { id: "backup-1", title: "유초등부 보고" },
        { id: "backup-2", title: "청년부 보고" },
      ],
    });
  });
});
