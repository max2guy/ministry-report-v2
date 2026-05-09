import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAccount,
  findAccountByNameAndEmail,
  maskEmail,
} from "./internalAuthStore";
import { isValidEmail, normalizeEmail } from "./emailValidation";

describe("emailValidation", () => {
  it("accepts any real-looking email domain", () => {
    expect(isValidEmail("reporter@gmail.com")).toBe(true);
    expect(isValidEmail("reporter@church.kr")).toBe(true);
  });

  it("normalizes email for account lookup", () => {
    expect(normalizeEmail(" Reporter@Example.COM ")).toBe("reporter@example.com");
  });

  it("rejects non-email text", () => {
    expect(isValidEmail("reporter")).toBe(false);
  });
});

describe("account lookup", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("ministry-report-v2-auth");
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "lookup-id"),
      subtle: crypto.subtle,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds an account by trimmed name and normalized email", async () => {
    await createAccount({
      displayName: "김우중",
      email: "Lookup@example.com",
      password: "password123",
    });

    const account = await findAccountByNameAndEmail({
      displayName: " 김우중 ",
      email: " lookup@EXAMPLE.com ",
    });

    expect(account?.displayName).toBe("김우중");
    expect(account?.email).toBe("lookup@example.com");
  });

  it("masks the local part of an email", () => {
    expect(maskEmail("kim@example.com")).toBe("ki***@example.com");
  });
});
