import { describe, expect, it, vi } from "vitest";
import type { DepartmentReport } from "./reportTypes";
import {
  addDepartmentMember,
  deriveAttendanceFromMembers,
  hasMemberCards,
  toggleDepartmentMember,
} from "./reportMembers";

function sampleDepartment(): DepartmentReport {
  return {
    key: "elementary",
    name: "유초등부",
    attendance: 0,
    newVisitors: 0,
    summary: "",
    members: [
      { id: "a", name: "권상우", status: "absent" },
      { id: "b", name: "천주아", status: "present" },
    ],
  };
}

describe("reportMembers", () => {
  it("derives attendance from present members", () => {
    expect(deriveAttendanceFromMembers(sampleDepartment())).toBe(1);
  });

  it("toggles one member status", () => {
    const updated = toggleDepartmentMember(sampleDepartment(), "a");

    expect(updated.members?.find((member) => member.id === "a")?.status).toBe(
      "present",
    );
    expect(updated.attendance).toBe(2);
  });

  it("adds a new absent member", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "new-member-id" });

    const updated = addDepartmentMember(sampleDepartment(), "새친구");

    expect(updated.members?.at(-1)).toMatchObject({
      id: "new-member-id",
      name: "새친구",
      status: "absent",
    });
    expect(updated.attendance).toBe(1);
  });

  it("treats missing members as legacy numeric mode", () => {
    expect(hasMemberCards({ ...sampleDepartment(), members: undefined })).toBe(
      false,
    );
  });
});
