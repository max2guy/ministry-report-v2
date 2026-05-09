import { describe, expect, it } from "vitest";
import { loadRoster, saveRoster } from "./memberRosterStore";

describe("memberRosterStore", () => {
  it("exposes the roster storage API", () => {
    expect(typeof loadRoster).toBe("function");
    expect(typeof saveRoster).toBe("function");
  });
});
