import { describe, expect, it, vi } from "vitest";
import { createDefaultRoster } from "./memberRoster";

describe("createDefaultRoster", () => {
  it("creates a roster with all four departments", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    expect(roster.departments.elementary.kind).toBe("flat");
    expect(roster.departments.middleHigh.kind).toBe("flat");
    expect(roster.departments.youngAdult.kind).toBe("flat");
    expect(roster.departments.adult.kind).toBe("zoned");
  });

  it("elementary has 2 members", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.elementary;
    if (dept.kind !== "flat") throw new Error("expected flat");
    expect(dept.members.map(m => m.name)).toEqual(["권상우", "천주아"]);
  });

  it("adult has 12 zones across 2 districts", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.adult;
    if (dept.kind !== "zoned") throw new Error("expected zoned");
    expect(dept.zones).toHaveLength(12);
    expect(dept.zones.filter(z => z.district === 1)).toHaveLength(6);
    expect(dept.zones.filter(z => z.district === 2)).toHaveLength(6);
  });

  it("zone leaders and inspectors have correct roles", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.adult;
    if (dept.kind !== "zoned") throw new Error("expected zoned");
    const zone1 = dept.zones[0];
    expect(zone1.members.find(m => m.role === "leader")?.name).toBe("이명숙");
    expect(zone1.members.find(m => m.role === "inspector")?.name).toBe("김영순");
  });
});
