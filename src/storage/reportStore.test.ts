import { describe, expect, it } from "vitest";
import {
  deleteReport,
  getReport,
  listReports,
  saveReport,
  saveReports,
} from "./reportStore";

describe("reportStore", () => {
  it("exposes the report storage API", () => {
    expect(typeof saveReport).toBe("function");
    expect(typeof saveReports).toBe("function");
    expect(typeof deleteReport).toBe("function");
    expect(typeof getReport).toBe("function");
    expect(typeof listReports).toBe("function");
  });
});
