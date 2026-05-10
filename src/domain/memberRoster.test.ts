import { describe, expect, it, vi } from "vitest";
import { createDefaultRoster, mergeRosterFromReport } from "./memberRoster";
import type { MinistryReport } from "./reportTypes";

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

describe("mergeRosterFromReport", () => {
  it("preserves group field from existing roster when report member has no group", () => {
    vi.unstubAllGlobals();
    const base = createDefaultRoster();
    // Set up group assignments in existing roster
    const elemDept = base.departments.elementary;
    if (elemDept.kind !== "flat") throw new Error("expected flat");
    elemDept.members[0].group = "A조";
    elemDept.members[1].group = "B조";

    // Simulated import data — no group field (old data format)
    const report = {
      departments: {
        elementary: {
          members: [
            { id: elemDept.members[0].id, name: elemDept.members[0].name, status: "absent" },
            { id: elemDept.members[1].id, name: elemDept.members[1].name, status: "present" },
          ],
        },
        middleHigh: { members: [] },
        youngAdult: { members: [] },
        adult: { zones: [] },
      },
    } as unknown as MinistryReport;

    const merged = mergeRosterFromReport(base, report);
    const mergedElem = merged.departments.elementary;
    if (mergedElem.kind !== "flat") throw new Error("expected flat");

    expect(mergedElem.members[0].group).toBe("A조");
    expect(mergedElem.members[1].group).toBe("B조");
  });

  it("uses report member group when present, overriding existing roster group", () => {
    vi.unstubAllGlobals();
    const base = createDefaultRoster();
    const elemDept = base.departments.elementary;
    if (elemDept.kind !== "flat") throw new Error("expected flat");
    elemDept.members[0].group = "A조";

    const report = {
      departments: {
        elementary: {
          members: [
            { id: elemDept.members[0].id, name: elemDept.members[0].name, status: "absent", group: "C조" },
          ],
        },
        middleHigh: { members: [] },
        youngAdult: { members: [] },
        adult: { zones: [] },
      },
    } as unknown as MinistryReport;

    const merged = mergeRosterFromReport(base, report);
    const mergedElem = merged.departments.elementary;
    if (mergedElem.kind !== "flat") throw new Error("expected flat");

    expect(mergedElem.members[0].group).toBe("C조");
  });
});
