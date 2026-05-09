import { openDB } from "idb";
import type { Account, UserRole } from "./authTypes";
import { isValidEmail, normalizeEmail } from "./emailValidation";

const DB_NAME = "ministry-report-v2-auth";
const STORE_NAME = "accounts";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function verifyPassword(
  account: Account,
  password: string,
): Promise<boolean> {
  return (
    (await hashPassword(password, account.passwordSalt)) === account.passwordHash
  );
}

export async function createAccount(input: {
  email: string;
  displayName: string;
  password: string;
  role?: UserRole;
}): Promise<Account> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  if (!isValidEmail(email)) throw new Error("INVALID_EMAIL");
  if (!displayName) throw new Error("MISSING_DISPLAY_NAME");
  if (input.password.length < 8) throw new Error("WEAK_PASSWORD");

  const database = await db();
  const accounts = await database.getAll(STORE_NAME);
  if (accounts.some((account) => account.email === email)) {
    throw new Error("DUPLICATE_EMAIL");
  }

  const now = new Date().toISOString();
  const salt = crypto.randomUUID();
  const account: Account = {
    id: crypto.randomUUID(),
    email,
    displayName,
    role: input.role ?? "reporter",
    passwordSalt: salt,
    passwordHash: await hashPassword(input.password, salt),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await database.put(STORE_NAME, account);
  return account;
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const database = await db();
  return database.get(STORE_NAME, id);
}

export async function listAccounts(): Promise<Account[]> {
  const database = await db();
  return database.getAll(STORE_NAME);
}

export async function authenticateAccount(input: {
  email: string;
  password: string;
}): Promise<Account> {
  const email = normalizeEmail(input.email);
  const database = await db();
  const accounts = await database.getAll(STORE_NAME);
  const account = accounts.find((item) => item.email === email);

  if (!account || !(await verifyPassword(account, input.password))) {
    throw new Error("INVALID_LOGIN");
  }

  return account;
}

export async function findAccountByNameAndEmail(input: {
  email: string;
  displayName: string;
}): Promise<Account | undefined> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const database = await db();
  const accounts = await database.getAll(STORE_NAME);

  return accounts.find(
    (account) =>
      account.email === email && account.displayName.trim() === displayName,
  );
}

export function maskEmail(email: string): string {
  const [localPart, domain = ""] = email.split("@");

  if (localPart.length <= 2) {
    return `${localPart.slice(0, 1)}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export async function setTemporaryPassword(
  account: Account,
  temporaryPassword: string,
): Promise<Account> {
  if (temporaryPassword.length < 8) throw new Error("WEAK_PASSWORD");

  const salt = crypto.randomUUID();
  const updated: Account = {
    ...account,
    passwordSalt: salt,
    passwordHash: await hashPassword(temporaryPassword, salt),
    status: "mustChangePassword",
    updatedAt: new Date().toISOString(),
  };

  const database = await db();
  await database.put(STORE_NAME, updated);
  return updated;
}

export async function changePassword(input: {
  account: Account;
  currentPassword: string;
  newPassword: string;
}): Promise<Account> {
  if (input.newPassword.length < 8) throw new Error("WEAK_PASSWORD");
  // mustChangePassword 상태면 임시 비밀번호이므로 현재 비밀번호 검증 스킵
  const skipVerify = input.account.status === "mustChangePassword";
  if (!skipVerify && !(await verifyPassword(input.account, input.currentPassword))) {
    throw new Error("INVALID_PASSWORD");
  }

  const salt = crypto.randomUUID();
  const updated: Account = {
    ...input.account,
    passwordSalt: salt,
    passwordHash: await hashPassword(input.newPassword, salt),
    status: "active",
    updatedAt: new Date().toISOString(),
  };

  const database = await db();
  await database.put(STORE_NAME, updated);
  return updated;
}
