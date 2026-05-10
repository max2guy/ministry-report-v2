import { beforeEach, describe, expect, it } from "vitest";
import { readStoredMode, STORAGE_KEY } from "./useAppMode";

describe("readStoredMode", () => {
  beforeEach(() => localStorage.clear());

  it("returns 'reporter' when nothing stored", () => {
    expect(readStoredMode()).toBe("reporter");
  });

  it("returns 'viewer' when stored value is 'viewer'", () => {
    localStorage.setItem(STORAGE_KEY, "viewer");
    expect(readStoredMode()).toBe("viewer");
  });

  it("returns 'reporter' for unknown stored value", () => {
    localStorage.setItem(STORAGE_KEY, "garbage");
    expect(readStoredMode()).toBe("reporter");
  });
});
