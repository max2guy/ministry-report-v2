import { describe, expect, it } from "vitest";
import { buildZoneSmsMessage, buildDistrictSmsMessage } from "./smsUtils";
import type { DepartmentMemberRole, DepartmentZone } from "../../domain/reportTypes";

const makeZone = (name: string, district: number, members: { name: string; status: "present" | "absent"; role?: DepartmentMemberRole }[]): DepartmentZone => ({
  id: "z1",
  name,
  district,
  members: members.map((m, i) => ({ id: `m${i}`, ...m })),
});

describe("buildZoneSmsMessage", () => {
  it("returns empty string when no absentees", () => {
    const zone = makeZone("1구역", 1, [{ name: "홍길동", status: "present" }]);
    expect(buildZoneSmsMessage(zone, "2026-05-07")).toBe("");
  });

  it("returns formatted message with absentees", () => {
    const zone = makeZone("1구역", 1, [
      { name: "홍길동", status: "absent" },
      { name: "김철수", status: "absent" },
      { name: "이영희", status: "present" },
    ]);
    const msg = buildZoneSmsMessage(zone, "2026-05-07");
    expect(msg).toContain("[2026-05-07 주일 결석 현황]");
    expect(msg).toContain("1구역 결석자 2명");
    expect(msg).toContain("홍길동 김철수");
    expect(msg).not.toContain("이영희");
  });
});

describe("buildDistrictSmsMessage", () => {
  it("returns empty string when no absentees in district", () => {
    const zones = [makeZone("1구역", 1, [{ name: "홍길동", status: "present" }])];
    expect(buildDistrictSmsMessage(1, zones, "2026-05-07")).toBe("");
  });

  it("returns formatted district message", () => {
    const zones = [
      makeZone("1구역", 1, [{ name: "홍길동", status: "absent" }]),
      makeZone("2구역", 1, [{ name: "김철수", status: "absent" }, { name: "이영희", status: "present" }]),
    ];
    const msg = buildDistrictSmsMessage(1, zones, "2026-05-07");
    expect(msg).toContain("[2026-05-07 주일 결석 현황]");
    expect(msg).toContain("1교구 총 결석 2명");
    expect(msg).toContain("1구역: 홍길동");
    expect(msg).toContain("2구역: 김철수");
  });
});
