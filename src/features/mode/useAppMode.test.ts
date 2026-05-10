import { beforeEach, describe, expect, it } from "vitest";
import { readStoredMode } from "./useAppMode";

describe("readStoredMode", () => {
  beforeEach(() => localStorage.clear());

  it("returns 'reporter' when nothing stored", () => {
    expect(readStoredMode()).toBe("reporter");
  });

  it("returns 'viewer' when stored value is 'viewer'", () => {
    localStorage.setItem("ministry-app-mode", "viewer");
    expect(readStoredMode()).toBe("viewer");
  });

  it("returns 'reporter' for unknown stored value", () => {
    localStorage.setItem("ministry-app-mode", "garbage");
    expect(readStoredMode()).toBe("reporter");
  });
});
