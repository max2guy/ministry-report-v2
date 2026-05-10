# Ministry Report v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate v2 PWA for ministry reports that keeps legacy data importable, requires lightweight internal reporter accounts, supports 유초등부/중고등부/청년부/장년 reports, and makes the report app and viewer app the same application surface.

**Architecture:** Create a new standalone project at `Projects/ministry-report-v2`. Use one internal auth store for reporter/admin accounts, one local-first report model, one department-aware report renderer, and route-level modes for editing and viewing. Legacy data is imported into a versioned schema instead of mutating the old app or old data in place.

**Tech Stack:** Vite, React, TypeScript, IndexedDB, Vitest, Playwright smoke checks, optional `vite-plugin-pwa` after the core app is stable.

---

## Assumptions

- The existing ministry report app is not currently available at a confirmed path in this workspace.
- Existing data may be in JSON, localStorage export, IndexedDB export, CSV, XLSX, or another app-specific format.
- v2 should not overwrite, migrate in place, or depend on the old app runtime.
- "Report app" and "viewer app" means one app with shared components, where permissions and route state decide whether editing controls are shown.
- Word document generation and NAS upload are intentionally removed from v2.
- The four required departments are 유초등부, 중고등부, 청년부, and 장년.
- Reporters must create accounts with a real personal email address and password.
- This is a church-internal app, so MVP email validation checks format and stores the address; email-link verification is not required.
- Admin recovery means setting a temporary password for the reporter, then requiring the reporter to change it after login.
- Passwords should still be stored as hashes, not plaintext.

## Out of Scope

- Word `.docx` document generation.
- NAS upload, NAS sync, or network file transfer automation.
- Background sync that scans local folders or remote storage.

## Discovered Legacy Data

- Existing app path: `/Users/kimwoojung/Projects/report-app`.
- Seed history file: `/Users/kimwoojung/Projects/report-app/history.json`.
- Browser runtime storage: `localStorage.reportHistory` and `localStorage.reportDraft`.
- `history.json` currently contains 13 reports from `2026-02-01` through `2026-04-26`.
- Legacy report entries use `youth`, `young`, and `adult`; v2 creates `elementary` as an empty department with a migration warning when legacy data has no 유초등부 fields.
- Official v2 department key mapping: `elementary -> 유초등부`, `middleHigh -> 중고등부`, `youngAdult -> 청년부`, `adult -> 장년`.
- `child` is not a supported department key or migration alias.

## Success Criteria

1. v2 lives under `Projects/ministry-report-v2` and does not modify the old report app.
2. Legacy data can be imported into a versioned v2 schema with a visible migration result.
3. Report and viewer modes render the same report from the same component and data model.
4. Reports include all four departments: 유초등부, 중고등부, 청년부, 장년.
5. Reporter accounts require personal email addresses before report submission.
6. Admin users can set temporary passwords for account recovery.
7. The app works offline after first load for already-authenticated users.
8. No Word-generation or NAS-upload dependency, config, or UI is added.
9. Build and tests pass through CLI commands only.

## File Structure

- Create: `package.json` - scripts and minimal dependencies.
- Create: `index.html` - Vite entry.
- Create: `src/main.tsx` - app bootstrap.
- Create: `src/App.tsx` - route/mode shell.
- Create: `src/auth/authTypes.ts` - reporter/admin account types.
- Create: `src/auth/emailValidation.ts` - email validation boundary.
- Create: `src/auth/emailValidation.test.ts` - email validation tests.
- Create: `src/auth/internalAuthStore.ts` - church-internal account persistence and password reset boundary.
- Create: `src/features/auth/SignUpForm.tsx` - reporter account creation UI.
- Create: `src/features/admin/AdminRecoveryPanel.tsx` - admin password recovery UI.
- Create: `src/domain/reportTypes.ts` - versioned four-department report schema.
- Create: `src/domain/reportMigrations.ts` - legacy-to-v2 migration functions.
- Create: `src/domain/reportMigrations.test.ts` - migration tests.
- Create: `src/storage/reportStore.ts` - IndexedDB persistence boundary.
- Create: `src/features/report/ReportEditor.tsx` - edit controls.
- Create: `src/features/report/ReportViewer.tsx` - read-only wrapper.
- Create: `src/features/report/ReportCanvas.tsx` - shared renderer used by editor and viewer.
- Create: `src/features/import/LegacyImportPanel.tsx` - legacy import UI.
- Create: `src/styles.css` - compact app styling.
- Create: `tests/smoke/report-v2.spec.ts` - browser smoke checks.

## Phase 1: Project Shell

### Task 1: Scaffold New PWA Project

**Files:**
- Create: `Projects/ministry-report-v2/package.json`
- Create: `Projects/ministry-report-v2/index.html`
- Create: `Projects/ministry-report-v2/src/main.tsx`
- Create: `Projects/ministry-report-v2/src/App.tsx`
- Create: `Projects/ministry-report-v2/src/styles.css`

- [x] **Step 1: Create package scripts**

```json
{
  "name": "ministry-report-v2",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "preview": "vite preview",
    "smoke": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.4.0",
    "vite": "^6.3.5",
    "typescript": "^5.8.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "idb": "^8.0.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.51.1",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.0.12",
    "@types/react-dom": "^19.0.4",
    "vitest": "^3.1.2"
  }
}
```

- [x] **Step 2: Add minimal app entry**

`src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [x] **Step 3: Add initial shell**

`src/App.tsx`

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="top-bar">
        <h1>사역보고서 v2</h1>
      </header>
      <section className="workspace" aria-label="사역보고서 작업 영역">
        <p>v2 프로젝트 준비 중</p>
      </section>
    </main>
  );
}
```

- [x] **Step 4: Verify**

Run: `npm install`

Run: `npm run build`

Expected: TypeScript and Vite build complete without errors.

- [ ] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2
git commit -m "chore: scaffold ministry report v2"
```

## Phase 2: Internal Accounts

### Task 2: Add Lightweight Reporter Accounts

**Files:**
- Create: `Projects/ministry-report-v2/src/auth/authTypes.ts`
- Create: `Projects/ministry-report-v2/src/auth/emailValidation.ts`
- Create: `Projects/ministry-report-v2/src/auth/emailValidation.test.ts`
- Create: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Create: `Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx`
- Create: `Projects/ministry-report-v2/src/features/admin/AdminRecoveryPanel.tsx`

- [x] **Step 1: Add account types**

```ts
export type UserRole = "reporter" | "admin";

export type AccountStatus = "active" | "mustChangePassword";

export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordSalt: string;
  passwordHash: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
};
```

- [x] **Step 2: Add email validation**

```ts
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}
```

- [x] **Step 3: Test email validation**

```ts
import { describe, expect, it } from "vitest";
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
```

- [x] **Step 4: Add internal account store**

```ts
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
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAccount(input: {
  email: string;
  displayName: string;
  password: string;
  role?: UserRole;
}): Promise<Account> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new Error("INVALID_EMAIL");
  if (input.password.length < 8) throw new Error("WEAK_PASSWORD");

  const now = new Date().toISOString();
  const salt = crypto.randomUUID();
  const account: Account = {
    id: crypto.randomUUID(),
    email,
    displayName: input.displayName.trim(),
    role: input.role ?? "reporter",
    passwordSalt: salt,
    passwordHash: await hashPassword(input.password, salt),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const database = await db();
  await database.put(STORE_NAME, account);
  return account;
}

export async function setTemporaryPassword(account: Account, temporaryPassword: string): Promise<Account> {
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
```

- [x] **Step 5: Add reporter sign-up form**

```tsx
import { useState, type FormEvent } from "react";
import { createAccount } from "../../auth/internalAuthStore";

type SignUpFormProps = {
  onCreated: (accountId: string) => void;
};

export function SignUpForm({ onCreated }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const account = await createAccount({ email, displayName, password });
      setError("");
      onCreated(account.id);
    } catch {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        이름
        <input value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
      </label>
      <label>
        이메일
        <input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
      </label>
      <button type="submit">계정 생성</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
```

- [x] **Step 6: Add admin recovery panel**

```tsx
import { useState } from "react";
import type { Account } from "../../auth/authTypes";
import { setTemporaryPassword } from "../../auth/internalAuthStore";

type AdminRecoveryPanelProps = {
  account: Account;
  onRecovered: (account: Account) => void;
};

export function AdminRecoveryPanel({ account, onRecovered }: AdminRecoveryPanelProps) {
  const [temporaryPassword, setTemporaryPasswordValue] = useState("");
  const [message, setMessage] = useState("");

  async function handleReset() {
    const updated = await setTemporaryPassword(account, temporaryPassword);
    setTemporaryPasswordValue("");
    setMessage("임시 비밀번호가 설정되었습니다.");
    onRecovered(updated);
  }

  return (
    <section className="admin-panel" aria-label="비밀번호 복구">
      <h2>비밀번호 복구</h2>
      <p>{account.email}</p>
      <label>
        임시 비밀번호
        <input
          type="password"
          value={temporaryPassword}
          onChange={(event) => setTemporaryPasswordValue(event.currentTarget.value)}
        />
      </label>
      <button type="button" onClick={handleReset}>임시 비밀번호 설정</button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
```

- [x] **Step 7: Verify**

Run: `npm test -- src/auth/emailValidation.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: Account types and internal store compile without backend setup.

## Phase 3: Versioned Data Model

### Task 3: Define v2 Report Schema

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportTypes.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportTypes.test.ts`

Decision: keep `elementary` as the official internal key for 유초등부. Do not introduce `child` as a key or alias.

- [x] **Step 1: Add schema types**

```ts
export type ReportSchemaVersion = 2;

export type DepartmentKey = "elementary" | "middleHigh" | "youngAdult" | "adult";

export type DepartmentReport = {
  key: DepartmentKey;
  name: string;
  attendance: number;
  newVisitors: number;
  summary: string;
};

export type MinistryReport = {
  schemaVersion: ReportSchemaVersion;
  id: string;
  title: string;
  reportDate: string;
  churchName: string;
  pastorName: string;
  departments: Record<DepartmentKey, DepartmentReport>;
  offerings: {
    total: number;
    memo: string;
  };
  prayerRequests: string[];
  announcements: string[];
  createdAt: string;
  updatedAt: string;
};
```

- [x] **Step 2: Add factory for empty report**

```ts
export function createEmptyReport(now = new Date()): MinistryReport {
  const iso = now.toISOString();

  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    title: "주간 사역보고서",
    reportDate: iso.slice(0, 10),
    churchName: "",
    pastorName: "",
    departments: {
      elementary: {
        key: "elementary",
        name: "유초등부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
      },
      middleHigh: {
        key: "middleHigh",
        name: "중고등부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
      },
      youngAdult: {
        key: "youngAdult",
        name: "청년부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
      },
      adult: {
        key: "adult",
        name: "장년",
        attendance: 0,
        newVisitors: 0,
        summary: "",
      },
    },
    offerings: {
      total: 0,
      memo: "",
    },
    prayerRequests: [],
    announcements: [],
    createdAt: iso,
    updatedAt: iso,
  };
}
```

- [x] **Step 3: Test default schema**

```ts
import { describe, expect, it } from "vitest";
import { createEmptyReport } from "./reportTypes";

describe("createEmptyReport", () => {
  it("creates a versioned v2 report", () => {
    const report = createEmptyReport(new Date("2026-04-30T00:00:00.000Z"));

    expect(report.schemaVersion).toBe(2);
    expect(report.reportDate).toBe("2026-04-30");
    expect(report.departments.elementary.name).toBe("유초등부");
    expect(report.departments.middleHigh.name).toBe("중고등부");
    expect(report.departments.youngAdult.name).toBe("청년부");
    expect(report.departments.adult.name).toBe("장년");
  });
});
```

- [x] **Step 4: Verify**

Run: `npm test -- src/domain/reportTypes.test.ts`

Expected: PASS.

## Phase 4: Legacy Data Memory

### Task 4: Build Legacy Import Contract

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportMigrations.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportMigrations.test.ts`

- [x] **Step 1: Define legacy input shape**

```ts
import type { MinistryReport } from "./reportTypes";

export type LegacyReportInput = {
  title?: unknown;
  date?: unknown;
  reportDate?: unknown;
  churchName?: unknown;
  pastorName?: unknown;
  departments?: unknown;
  attendance?: unknown;
  offerings?: unknown;
  prayerRequests?: unknown;
  announcements?: unknown;
};

export type MigrationResult = {
  report: MinistryReport;
  warnings: string[];
};
```

- [x] **Step 2: Add migration helper**

```ts
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function objectRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}
```

- [x] **Step 3: Add migration function**

Implementation note: the completed migration also supports the actual existing `history.json` shape from `/Users/kimwoojung/Projects/report-app`, including `youth`, `young`, `adult`, `nextWeekPlan`, `prayer`, and `generalOpinion`.
`child` is intentionally not supported; 유초등부 migration accepts `departments.elementary` or legacy `attendance.children` only.

```ts
export function migrateLegacyReport(input: LegacyReportInput, now = new Date()): MigrationResult {
  const iso = now.toISOString();
  const departments = objectRecord(input.departments);
  const attendance = objectRecord(input.attendance);
  const offerings = objectRecord(input.offerings);

  function department(key: "elementary" | "middleHigh" | "youngAdult" | "adult", name: string, legacyAttendanceKey: string) {
    const legacyDepartment = objectRecord(departments[key]);

    return {
      key,
      name,
      attendance: optionalNumberValue(legacyDepartment.attendance) ?? numberValue(attendance[legacyAttendanceKey]),
      newVisitors: numberValue(legacyDepartment.newVisitors),
      summary: text(legacyDepartment.summary),
    };
  }

  return {
    report: {
      schemaVersion: 2,
      id: crypto.randomUUID(),
      title: text(input.title) || "주간 사역보고서",
      reportDate: text(input.reportDate) || text(input.date) || iso.slice(0, 10),
      churchName: text(input.churchName),
      pastorName: text(input.pastorName),
      departments: {
        elementary: department("elementary", "유초등부", "children"),
        middleHigh: department("middleHigh", "중고등부", "youth"),
        youngAdult: department("youngAdult", "청년부", "youngAdult"),
        adult: department("adult", "장년", "adult"),
      },
      offerings: {
        total: numberValue(offerings.total),
        memo: text(offerings.memo),
      },
      prayerRequests: stringList(input.prayerRequests),
      announcements: stringList(input.announcements),
      createdAt: iso,
      updatedAt: iso,
    },
    warnings: [],
  };
}
```

- [x] **Step 4: Test migration**

```ts
import { describe, expect, it, vi } from "vitest";
import { migrateLegacyReport } from "./reportMigrations";

describe("migrateLegacyReport", () => {
  it("preserves legacy report fields in v2 format", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "report-1" });

    const result = migrateLegacyReport({
      title: "4월 사역보고",
      date: "2026-04-26",
      churchName: "샘플교회",
      pastorName: "김목사",
      attendance: { adult: 80, youth: 12, children: 9, youngAdult: 30 },
      offerings: { total: 1200000, memo: "주일 헌금" },
      prayerRequests: ["환우를 위해"],
      announcements: ["5월 행사 준비"],
    }, new Date("2026-04-30T00:00:00.000Z"));

    expect(result.report).toMatchObject({
      schemaVersion: 2,
      id: "report-1",
      title: "4월 사역보고",
      reportDate: "2026-04-26",
      churchName: "샘플교회",
      departments: {
        elementary: { name: "유초등부", attendance: 9 },
        middleHigh: { name: "중고등부", attendance: 12 },
        youngAdult: { name: "청년부", attendance: 30 },
        adult: { name: "장년", attendance: 80 },
      },
    });
  });
});
```

- [x] **Step 5: Verify**

Run: `npm test -- src/domain/reportMigrations.test.ts`

Expected: PASS.

## Phase 5: Shared Report and Viewer UI

### Task 5: Create One Renderer for Both Modes

**Files:**
- Create: `Projects/ministry-report-v2/src/features/report/ReportCanvas.tsx`
- Create: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Create: `Projects/ministry-report-v2/src/features/report/ReportViewer.tsx`
- Modify: `Projects/ministry-report-v2/src/App.tsx`

- [x] **Step 1: Build shared renderer**

```tsx
import type { MinistryReport } from "../../domain/reportTypes";

type ReportCanvasProps = {
  report: MinistryReport;
};

export function ReportCanvas({ report }: ReportCanvasProps) {
  const departments = Object.values(report.departments);
  const totalAttendance = departments.reduce((total, department) => total + department.attendance, 0);

  return (
    <article className="report-canvas">
      <h2>{report.title}</h2>
      <dl>
        <dt>보고일</dt>
        <dd>{report.reportDate}</dd>
        <dt>교회</dt>
        <dd>{report.churchName || "-"}</dd>
        <dt>담당자</dt>
        <dd>{report.pastorName || "-"}</dd>
        <dt>출석 합계</dt>
        <dd>{totalAttendance.toLocaleString("ko-KR")}명</dd>
      </dl>
      <section aria-label="부서별 보고">
        <h3>부서별 보고</h3>
        <ul>
          {departments.map((department) => (
            <li key={department.key}>
              <strong>{department.name}</strong>
              <span>{department.attendance.toLocaleString("ko-KR")}명</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
```

- [x] **Step 2: Use renderer in editor**

```tsx
import type { MinistryReport } from "../../domain/reportTypes";
import { ReportCanvas } from "./ReportCanvas";

type ReportEditorProps = {
  report: MinistryReport;
};

export function ReportEditor({ report }: ReportEditorProps) {
  return (
    <section className="report-mode">
      <aside className="edit-panel" aria-label="보고서 편집">
        <button type="button">저장</button>
        <button type="button">가져오기</button>
      </aside>
      <ReportCanvas report={report} />
    </section>
  );
}
```

- [x] **Step 3: Use same renderer in viewer**

```tsx
import type { MinistryReport } from "../../domain/reportTypes";
import { ReportCanvas } from "./ReportCanvas";

type ReportViewerProps = {
  report: MinistryReport;
};

export function ReportViewer({ report }: ReportViewerProps) {
  return (
    <section className="report-mode viewer-mode">
      <ReportCanvas report={report} />
    </section>
  );
}
```

- [x] **Step 4: Wire modes in App**

```tsx
import { useMemo, useState } from "react";
import { createEmptyReport } from "./domain/reportTypes";
import { ReportEditor } from "./features/report/ReportEditor";
import { ReportViewer } from "./features/report/ReportViewer";

export function App() {
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const report = useMemo(() => createEmptyReport(), []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <h1>사역보고서 v2</h1>
        <div className="segmented-control" aria-label="보기 모드">
          <button type="button" aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>보고서</button>
          <button type="button" aria-pressed={mode === "view"} onClick={() => setMode("view")}>뷰어</button>
        </div>
      </header>
      {mode === "edit" ? <ReportEditor report={report} /> : <ReportViewer report={report} />}
    </main>
  );
}
```

- [x] **Step 5: Verify**

Run: `npm run build`

Expected: Build passes and both modes compile.

## Phase 6: Persistence and Import UI

### Task 6: Add Local Storage Boundary

**Files:**
- Create: `Projects/ministry-report-v2/src/storage/reportStore.ts`
- Create: `Projects/ministry-report-v2/src/storage/reportStore.test.ts`

- [x] **Step 1: Add store API**

```ts
import { openDB } from "idb";
import type { MinistryReport } from "../domain/reportTypes";

const DB_NAME = "ministry-report-v2";
const STORE_NAME = "reports";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });
}

export async function saveReport(report: MinistryReport): Promise<void> {
  const database = await db();
  await database.put(STORE_NAME, report);
}

export async function getReport(id: string): Promise<MinistryReport | undefined> {
  const database = await db();
  return database.get(STORE_NAME, id);
}

export async function listReports(): Promise<MinistryReport[]> {
  const database = await db();
  return database.getAll(STORE_NAME);
}
```

- [x] **Step 2: Verify with browser smoke test instead of Node-only IndexedDB mocking**

Run: `npm run smoke`

Expected: A report can be saved and reloaded in the browser.

Note: verified by Phase 8 Playwright smoke test: legacy JSON imports, saves to IndexedDB, reloads, and remains visible in viewer mode.

### Task 7: Add Legacy Import Panel

**Files:**
- Create: `Projects/ministry-report-v2/src/features/import/LegacyImportPanel.tsx`
- Modify: `Projects/ministry-report-v2/src/App.tsx`

- [x] **Step 1: Add import component**

```tsx
import { useState } from "react";
import { migrateLegacyReport } from "../../domain/reportMigrations";
import type { MinistryReport } from "../../domain/reportTypes";

type LegacyImportPanelProps = {
  onImport: (report: MinistryReport) => void;
};

export function LegacyImportPanel({ onImport }: LegacyImportPanelProps) {
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    try {
      const json = JSON.parse(await file.text());
      const result = migrateLegacyReport(json);
      onImport(result.report);
      setError("");
    } catch {
      setError("가져올 수 없는 데이터입니다.");
    }
  }

  return (
    <section className="import-panel" aria-label="기존 데이터 가져오기">
      <input
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
```

- [x] **Step 2: Verify**

Run: `npm run build`

Expected: Import panel compiles and invalid JSON does not crash the app.

## Phase 7: Offline and Export

### Task 8: Add Export and Offline Readiness

**Files:**
- Modify: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Create: `Projects/ministry-report-v2/public/manifest.webmanifest`
- Modify: `Projects/ministry-report-v2/index.html`

- [x] **Step 1: Add JSON export**

```tsx
function downloadReport(report: MinistryReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.reportDate}-ministry-report-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

- [x] **Step 2: Add manifest**

```json
{
  "name": "사역보고서 v2",
  "short_name": "사역보고서",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#f7f8f5",
  "theme_color": "#24564a",
  "lang": "ko"
}
```

- [x] **Step 3: Verify**

Run: `npm run build`

Expected: Build includes the manifest and export button compiles.

## Phase 8: Smoke Verification

### Task 9: Add End-to-End Smoke Test

**Files:**
- Create: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`
- Create: `Projects/ministry-report-v2/playwright.config.ts`

- [x] **Step 1: Add Playwright config**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
  },
});
```

- [x] **Step 2: Add smoke test**

```ts
import { expect, test } from "@playwright/test";

test("report and viewer modes share the same report title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "사역보고서 v2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "주간 사역보고서" })).toBeVisible();

  await page.getByRole("button", { name: "뷰어" }).click();
  await expect(page.getByRole("heading", { name: "주간 사역보고서" })).toBeVisible();
});
```

- [x] **Step 3: Verify**

Run: `npm run smoke`

Expected: PASS in Chromium.

## Phase 9: Release Gate

### Task 10: Final CLI Verification

**Files:**
- No file changes.

- [x] **Step 1: Run tests**

Run: `npm test`

Expected: PASS.

- [x] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [x] **Step 3: Run smoke test**

Run: `npm run smoke`

Expected: PASS.

- [x] **Step 4: Commit**

Committed as `167977e feat: build ministry report v2`.

```bash
git add Projects/ministry-report-v2
git commit -m "feat: build ministry report v2"
```

## Post-MVP: Report Editing Form

### Task 11: Add Direct Report Editing

**Files:**
- Create: `Projects/ministry-report-v2/src/features/report/ReportForm.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportCanvas.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add editable report form**

Supports title, report date, church, reporter, four department attendance/new visitor counts, department summaries, prayer requests, and announcements.

- [x] **Step 2: Connect editor state to shared viewer data**

The editor form updates the same `MinistryReport` object rendered by `ReportCanvas`, so editor and viewer modes stay aligned.

- [x] **Step 3: Add browser smoke coverage**

Smoke test verifies edited report fields appear in editor preview and remain visible after switching to viewer mode.

### Task 12: Require Reporter Account For Save

**Files:**
- Update: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Update: `Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx`
- Create: `Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add account lookup boundary**

`internalAuthStore` exposes account listing and lookup so the app can restore local reporter account state.

- [x] **Step 2: Gate report saving behind a reporter account**

The save button stays disabled until a reporter account is selected or created. Creating an account sets the report's visible reporter name.

- [x] **Step 3: Add browser smoke coverage**

Smoke test verifies save is blocked without an account, account creation enables save, and the save message includes the reporter name.

### Task 13: Add Saved Report History Loading

**Files:**
- Create: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Track saved reports in app state**

Initial load reads stored reports once, sorts them by report date, and keeps the list available for the editor.

- [x] **Step 2: Show saved report list in the editor**

`ReportHistoryPanel` renders stored reports with date, title, and attendance total. Selecting an item loads it into the shared editor/viewer report state.

- [x] **Step 3: Refresh history after save and import**

Saving upserts the current report into the list. Legacy import merges imported reports into the list and selects the latest report.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies imported historical reports appear as loadable items and selecting an older report updates the visible report.

### Task 14: Add New Report Draft Action

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add new report button**

The editor sidebar exposes a `새 보고서` action near the save/export controls.

- [x] **Step 2: Create an unsaved blank report draft**

Clicking the button creates a fresh `createEmptyReport()` draft with a new id. If a reporter account is active, the visible reporter name is retained.

- [x] **Step 3: Add browser smoke coverage**

Smoke test verifies the draft resets title and department attendance while preserving the active reporter name.

### Task 15: Add Current Draft Auto-Save

**Files:**
- Create: `Projects/ministry-report-v2/src/storage/reportDraftStore.ts`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add local draft storage**

The current editor report is stored separately from the explicit saved report list in `localStorage`.

- [x] **Step 2: Restore draft before latest saved report**

On app load, the current draft is restored first. If no draft exists, the latest saved report still loads.

- [x] **Step 3: Save draft on report changes and navigation**

Editing fields, creating a new report, selecting history, importing reports, and explicit save all update the current draft.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies unsaved title, attendance, and prayer request fields survive a page reload.

### Task 16: Connect Admin Password Recovery

**Files:**
- Create: `Projects/ministry-report-v2/src/features/admin/AdminRecoveryManager.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add recovery account selector**

The editor sidebar exposes an admin recovery section with a reporter account selector.

- [x] **Step 2: Reuse existing recovery boundary**

`AdminRecoveryManager` delegates temporary password setting to `AdminRecoveryPanel`, which already calls `setTemporaryPassword()`.

- [x] **Step 3: Keep account state current after recovery**

Recovered accounts replace the matching account in app state so status updates remain available locally.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies creating an account, selecting it as the recovery target, and setting an 8+ character temporary password.

### Task 17: Add Temporary Password Change Flow

**Files:**
- Update: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Create: `Projects/ministry-report-v2/src/features/auth/PasswordChangePanel.tsx`
- Update: `Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add password verification and change boundary**

`internalAuthStore.changePassword()` verifies the current or temporary password against the stored hash, writes the new hash, and returns the account to `active`.

- [x] **Step 2: Show change form for recovered accounts**

Reporter accounts with `mustChangePassword` show a compact password change form in the reporter account panel.

- [x] **Step 3: Keep account state active after change**

After a successful password change, the reporter panel replaces the account in app state and removes the change-required UI.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies admin temporary password recovery followed by reporter password change.

### Task 18: Add Offline PWA Shell

**Files:**
- Create: `Projects/ministry-report-v2/public/sw.js`
- Update: `Projects/ministry-report-v2/src/main.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add service worker shell cache**

The service worker pre-caches the app shell and uses cached `index.html` for offline navigation fallback.

- [x] **Step 2: Cache loaded assets opportunistically**

Successful same-origin GET responses are copied into the shell cache so assets loaded during first use remain available offline.

- [x] **Step 3: Register service worker from the app entry**

`src/main.tsx` registers `/sw.js` when service workers are available.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies the app and current draft reload while the browser context is offline after first load.

### Task 19: Add Existing Reporter Login

**Files:**
- Update: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Create: `Projects/ministry-report-v2/src/features/auth/SignInForm.tsx`
- Update: `Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add account authentication boundary**

`internalAuthStore.authenticateAccount()` normalizes email, verifies the stored password hash, and returns the matching account.

- [x] **Step 2: Add reporter login form**

Reporter account panel now includes a compact login form for existing accounts using email and password.

- [x] **Step 3: Add logout action**

The active reporter card includes `로그아웃`, which clears the active account and disables report save until login or account creation.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies creating an account, logging out, logging back in with email/password, and re-enabling report save.

### Task 20: Add Saved Report Deletion

**Files:**
- Update: `Projects/ministry-report-v2/src/storage/reportStore.ts`
- Update: `Projects/ministry-report-v2/src/storage/reportStore.test.ts`
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add delete storage API**

`reportStore.deleteReport()` removes a saved report from IndexedDB by id.

- [x] **Step 2: Add history delete action**

Each saved report row includes a delete button using the report date for a clear accessible label.

- [x] **Step 3: Keep active report valid after deletion**

Deleting the current report moves the editor to the remaining latest report, or a fresh blank report when none remain.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies deleting an imported historical report removes it from the list and moves the visible report to the remaining latest report.

### Task 21: Add Saved Report Search

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies the saved report list can be filtered by visible title text and department summary text.

- [x] **Step 2: Add search text index**

The history panel builds a lightweight in-memory search string from report date, title, reporter, department names, attendance, summaries, prayers, and announcements.

- [x] **Step 3: Add search input and empty result state**

Saved reports show a compact `보고서 검색` field when history exists and display `검색 결과가 없습니다.` when the query has no matches.

### Task 22: Add Saved Report Summary

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies the history panel summarizes the visible saved report count and attendance total.

- [x] **Step 2: Add visible-list summary**

The history panel now calculates the count and attendance total from the currently visible list, so search results update the summary.

### Task 23: Show Legacy Import Warnings

**Files:**
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/features/import/LegacyImportPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies legacy import warnings are visible after importing data missing 유초등부.

- [x] **Step 2: Persist latest import warnings in app state**

The app stores the warning list from the most recent successful import so the sidebar can render it after the import completes.

- [x] **Step 3: Render warning list in the import panel**

The import panel shows `가져오기 경고` with each migration warning under the file input.

### Task 24: Restore V2 Backup Bundles

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportImport.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportImport.test.ts`
- Update: `Projects/ministry-report-v2/src/features/import/LegacyImportPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing parser coverage**

Unit test verifies a v2 backup object shaped as `{ schemaVersion: 2, reports: [...] }` imports as multiple reports instead of one wrapper record.

- [x] **Step 2: Add import parser boundary**

`parseReportImport()` accepts legacy arrays, single legacy records, single v2 reports, and v2 backup bundles while keeping official department keys and display names.

- [x] **Step 3: Wire the import panel to the parser**

The existing JSON file input now routes through `parseReportImport()` so restored v2 backups use the same save and warning flow as legacy imports.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies importing a v2 backup bundle stores two reports, updates history summary, and reloads the older restored report.

### Task 25: Export All Saved Reports Backup

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportBackup.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportBackup.test.ts`
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing backup bundle coverage**

Unit test verifies saved reports are wrapped as `{ schemaVersion: 2, exportedAt, reports }`.

- [x] **Step 2: Add backup creation boundary**

`createReportBackup()` produces the v2 backup bundle used by the export UI and accepted by the restore parser.

- [x] **Step 3: Add history export action**

The saved report panel shows `전체 백업` when reports exist and downloads all saved reports, independent of the current search filter.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies the downloaded backup filename and JSON contents include all saved reports.

### Task 26: Add Department Totals To History Summary

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies the saved report summary shows 유초등부, 중고등부, 청년부, and 장년 attendance totals.

- [x] **Step 2: Calculate visible department totals**

The history panel now calculates department attendance totals from the currently visible report list, so search filters update both overall and department summaries.

- [x] **Step 3: Render compact department summary**

The saved report panel renders the four department totals in a small two-column summary grid.

### Task 27: Copy Saved Report As Draft

**Files:**
- Update: `Projects/ministry-report-v2/src/domain/reportTypes.ts`
- Update: `Projects/ministry-report-v2/src/domain/reportTypes.test.ts`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing draft-copy coverage**

Unit test verifies a copied report gets a fresh id, today's report date, fresh timestamps, and keeps department content.

- [x] **Step 2: Add clone helper**

`cloneReportAsDraft()` creates an editable draft from a saved report without adding it to saved history.

- [x] **Step 3: Add history copy action**

Each saved report row now includes a `복사` action that opens the copied report as the active draft.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies copying a saved report updates the editor fields and leaves the saved report count unchanged.

### Task 28: Validate Report Before Save

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportValidation.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportValidation.test.ts`
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing validation coverage**

Unit test verifies title, report date, and reporter name are required before saving.

- [x] **Step 2: Add save validation boundary**

`validateReportForSave()` returns user-facing validation messages without touching storage.

- [x] **Step 3: Block invalid saves**

The save handler validates the account-applied report and shows the first validation message instead of writing invalid data.

- [x] **Step 4: Add browser smoke coverage**

Smoke test verifies a logged-in reporter cannot save a blank-title report and no saved history entry is created.

### Task 29: Show All Save Validation Errors

**Files:**
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/features/report/ReportEditor.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies multiple save validation errors render together in a `저장 오류` list.

- [x] **Step 2: Track save errors in app state**

The app stores the latest save validation errors and clears them when the report changes or a new valid workflow begins.

- [x] **Step 3: Render save error list**

The report editor now shows all current validation messages under an accessible `저장 오류` alert panel.

### Task 30: Filter Saved Reports By Month

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies selecting a report month filters saved reports and updates summary totals.

- [x] **Step 2: Add month filter state**

The history panel now tracks a `보고월` month value and applies it together with the free-text search query.

- [x] **Step 3: Render month input**

The saved report panel renders a compact month input below the search field.

### Task 31: Clear Saved Report Filters

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies search and month filters can be reset together from the saved report panel.

- [x] **Step 2: Add active-filter reset action**

The history panel now shows `필터 초기화` only when a search query or report month is active.

- [x] **Step 3: Reset both filter inputs**

The reset action clears both the free-text search and report month so the full saved report list and summaries return.

### Task 32: Mark Current Saved Report

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies the current saved report has a visible `현재` marker and the marker moves when another saved report is loaded.

- [x] **Step 2: Add current marker**

The history load button now renders a compact `현재` badge when the saved report id matches the active report id.

- [x] **Step 3: Style the marker**

The current marker uses a small high-contrast badge inside the existing history row.

### Task 33: Confirm Saved Report Deletion

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportHistoryPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing browser coverage**

Smoke test verifies canceling the delete confirmation keeps the saved report and visible report unchanged.

- [x] **Step 2: Add delete confirmation**

The saved report delete action now asks for browser confirmation before calling the delete handler.

- [x] **Step 3: Update delete smoke coverage**

Existing delete smoke now accepts the confirmation dialog before asserting the report is removed.

### Task 34: Add PWA Install Icon Metadata

**Files:**
- Create: `Projects/ministry-report-v2/public/icon.svg`
- Update: `Projects/ministry-report-v2/public/manifest.webmanifest`
- Update: `Projects/ministry-report-v2/public/sw.js`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing manifest smoke coverage**

Smoke test verifies the web app manifest advertises an install icon and the icon file is served.

- [x] **Step 2: Add install icon asset**

The app now includes a lightweight SVG icon matching the existing green report visual language.

- [x] **Step 3: Wire icon into PWA shell**

The manifest references `/icon.svg`, and the service worker pre-caches the icon with the app shell.

### Task 35: Add Viewer Print Action

**Files:**
- Update: `Projects/ministry-report-v2/src/features/report/ReportViewer.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing print smoke coverage**

Smoke test verifies viewer mode exposes an `인쇄` action, calls `window.print()`, and hides app controls in print media.

- [x] **Step 2: Add viewer print action**

Add a compact viewer action bar with an `인쇄` button that delegates to the browser print flow.

- [x] **Step 3: Add print-only report layout**

Print media should hide top-level app controls and action bars while leaving the report canvas visible without screen-only chrome.

### Task 36: Add Release Verification Command

**Files:**
- Update: `Projects/ministry-report-v2/package.json`
- Update: `Projects/ministry-report-v2/README.md`

- [x] **Step 1: Add one-command release gate**

`npm run verify` now runs unit tests, the production build, and Playwright smoke tests in sequence.

- [x] **Step 2: Document local and release commands**

README now lists install, dev, test, build, smoke, and full release verification commands.

### Task 37: Run Smoke Tests Against Production Preview

**Files:**
- Update: `Projects/ministry-report-v2/package.json`
- Update: `Projects/ministry-report-v2/playwright.config.ts`
- Update: `Projects/ministry-report-v2/README.md`

- [x] **Step 1: Point default smoke tests at preview**

Playwright now defaults to Vite preview on `127.0.0.1:4173`, so smoke tests exercise the built `dist` output.

- [x] **Step 2: Keep a dev-server smoke option**

`npm run smoke:dev` keeps the fast development-server path available when needed.

- [x] **Step 3: Avoid duplicate builds in verify**

`npm run verify` now runs unit tests and then `npm run smoke`, which builds once before serving production preview.

### Task 38: Clear Stale Import Warnings On Failed Import

**Files:**
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/src/features/import/LegacyImportPanel.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing invalid-import smoke coverage**

Smoke test verifies a failed JSON import clears the previous import warnings and reports the import error.

- [x] **Step 2: Report import errors to app state**

The import panel should notify the app when JSON parsing/import parsing fails.

- [x] **Step 3: Clear stale import UI after failure**

The app should clear previous import warnings and publish the import error as the current status.

### Task 39: Show Admin Recovery Account Status

**Files:**
- Update: `Projects/ministry-report-v2/src/features/admin/AdminRecoveryManager.tsx`
- Update: `Projects/ministry-report-v2/src/features/admin/AdminRecoveryPanel.tsx`
- Update: `Projects/ministry-report-v2/src/styles.css`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing recovery status smoke coverage**

Smoke test verifies the admin recovery panel shows `비밀번호 변경 필요` after an admin sets a temporary password.

- [x] **Step 2: Add status text to recovery targets**

Recovery target options should include whether an account is active or requires password change.

- [x] **Step 3: Show selected account status in recovery panel**

The selected recovery account should show a compact status line next to its email.

### Task 40: Prevent Duplicate Reporter Emails

**Files:**
- Update: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Update: `Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing duplicate-email smoke coverage**

Smoke test verifies a second account cannot be created with the same normalized email address.

- [x] **Step 2: Reject duplicate normalized emails**

Account creation should check existing accounts after email normalization and throw a duplicate-email error.

- [x] **Step 3: Show a specific duplicate-email message**

The sign-up form should show `이미 등록된 이메일입니다.` when duplicate creation is rejected.

### Task 41: Smoke Test Single Report Export

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add current-report export coverage**

Smoke test verifies the `내보내기` button downloads the active report as a v2 JSON file.

- [x] **Step 2: Verify export filename**

The downloaded filename should use the report date and `ministry-report-v2.json` suffix.

- [x] **Step 3: Verify exported department schema**

The exported JSON should preserve the official `elementary` key and `유초등부` display name.

### Task 42: Smoke Test Temporary Password Login

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add recovery login coverage**

Smoke test verifies a reporter can log out and log back in with an admin-issued temporary password.

- [x] **Step 2: Verify password-change prompt after temporary login**

The reporter account panel should show `비밀번호 변경 필요` after temporary-password login.

- [x] **Step 3: Verify password-change fields are available**

The temporary login state should expose the current/temporary password and new password fields.

### Task 43: Block Saves Until Temporary Password Is Changed

**Files:**
- Update: `Projects/ministry-report-v2/src/App.tsx`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add failing temporary-password save coverage**

Smoke tests verify `저장` is disabled while the current account requires a password change.

- [x] **Step 2: Gate save eligibility by account status**

Reports should be saveable only when a reporter account exists and its status is `active`.

- [x] **Step 3: Re-enable save after password change**

After the reporter changes the temporary password, `저장` should become enabled again.

### Task 44: Add Browser and Apple PWA Metadata

**Files:**
- Update: `Projects/ministry-report-v2/index.html`
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Link the app icon from HTML**

The document now exposes `/icon.svg` as the browser favicon.

- [x] **Step 2: Add Apple home-screen metadata**

The document now includes Apple web-app capable, title, and status-bar metadata.

- [x] **Step 3: Smoke test install metadata**

Smoke coverage verifies the manifest, icon asset, favicon link, and Apple metadata are served.

### Task 45: Smoke Test Invalid Login

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add invalid-login coverage**

Smoke test verifies a wrong password shows `이메일 또는 비밀번호를 확인해 주세요.`

- [x] **Step 2: Keep account unselected after failed login**

After a failed login, the reporter account panel should still show the no-account helper text.

- [x] **Step 3: Keep save disabled after failed login**

The save button should remain disabled when login fails.

### Task 46: Smoke Test Single V2 Report Import

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add single-report import coverage**

Smoke test verifies a single exported v2 report JSON can be imported.

- [x] **Step 2: Verify restored report canvas**

The imported single report should become the visible report canvas.

- [x] **Step 3: Verify restored history row**

The imported single report should appear in saved history with its attendance total.

### Task 47: Smoke Test Backup Export Restore Roundtrip

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Export backup from saved reports**

Smoke test creates saved reports and downloads the generated v2 backup bundle.

- [x] **Step 2: Restore backup into a fresh browser context**

The downloaded backup JSON is imported into a separate empty browser context.

- [x] **Step 3: Verify restored history and canvas**

The restored app should show the expected report count, attendance total, history rows, and visible canvas.

### Task 48: Document Operation And Backup Guidance

**Files:**
- Update: `Projects/ministry-report-v2/README.md`

- [x] **Step 1: Document reporter account operation**

README now explains reporter accounts, admin temporary password recovery, and save blocking until password change.

- [x] **Step 2: Document paper/PDF output path**

README points users to viewer print output and keeps Word generation/NAS upload out of v2.

- [x] **Step 3: Document backup and restore safety**

README now explains full backup, single report JSON import, and local-only data storage assumptions.

### Task 49: Smoke Test Password Rotation After Recovery

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Log in with a temporary password**

Smoke test signs in with the admin-issued temporary password and confirms the password-change state appears.

- [x] **Step 2: Change to a new password and log out**

The recovered reporter changes to a permanent password, clearing the recovery-required state.

- [x] **Step 3: Reject the old temporary password and accept the new one**

After logout, the old temporary password should fail, while the new password should log in successfully and keep saving enabled.

### Task 50: Smoke Test Normalized Email Login

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Create a reporter account with a normalized email**

Smoke test signs up a reporter with a regular lowercase email.

- [x] **Step 2: Log out and sign back in with mixed case and spaces**

The login form uses a case-variant email with leading and trailing whitespace.

- [x] **Step 3: Verify login resolves to the stored normalized account**

The account panel should show `로그인되었습니다.`, the normalized email, and an enabled save button.

### Task 51: Smoke Test Invalid Email Signup Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Submit signup with a non-email value**

Smoke test fills the reporter signup email with invalid text such as `not-an-email`.

- [x] **Step 2: Verify signup stays blocked**

The browser email field validation should block submission and keep save disabled.

- [x] **Step 3: Verify no account card appears**

The invalid signup must not create a selected reporter account in the UI.

### Task 52: Smoke Test Weak Password Signup Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Submit signup with a short password**

Smoke test fills a valid reporter email with a password shorter than 8 characters.

- [x] **Step 2: Verify app-level signup error appears**

The signup form should show the existing invalid-credentials alert for a rejected weak password.

- [x] **Step 3: Verify no account is created**

The weak-password signup must not create an account card or enable saving.

### Task 53: Smoke Test Blank Name Signup Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Submit signup with a blank display name**

Smoke test fills the reporter name with whitespace only while using an otherwise valid email and password.

- [x] **Step 2: Verify app-level signup error appears**

The signup form should show the existing invalid-credentials alert for the rejected blank name.

- [x] **Step 3: Verify no account is created**

The blank-name signup must not create an account card or enable saving.

### Task 54: Smoke Test Weak Temporary Password Recovery Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Select an existing reporter for recovery**

Smoke test creates a reporter account and opens the admin recovery panel for that account.

- [x] **Step 2: Submit a too-short temporary password**

The admin recovery form uses a temporary password shorter than 8 characters.

- [x] **Step 3: Verify recovery stays blocked**

The recovery panel should show the weak-password warning, avoid the `비밀번호 변경 필요` state, and keep saving enabled for the current active session.

### Task 55: Smoke Test Weak New Password Change Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Enter forced password-change state**

Smoke test creates a reporter, issues a temporary password, and reaches the password-change panel.

- [x] **Step 2: Submit a too-short new password**

The password-change form uses the correct temporary password but a new password shorter than 8 characters.

- [x] **Step 3: Verify password-change state remains locked**

The panel should show the existing invalid-password message, keep `비밀번호 변경 필요` visible, and keep saving disabled.

### Task 56: Smoke Test Incorrect Current Password Change Rejection

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Enter forced password-change state**

Smoke test creates a reporter, issues a temporary password, and reaches the password-change panel.

- [x] **Step 2: Submit a wrong current/temporary password**

The password-change form uses a valid new password but an incorrect current or temporary password.

- [x] **Step 3: Verify password-change state remains locked**

The panel should show the existing invalid-password message, keep `비밀번호 변경 필요` visible, and keep saving disabled.

### Task 57: Smoke Test Summary Refresh After Deletion

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Import multiple saved reports**

Smoke test loads two saved reports with distinct attendance totals.

- [x] **Step 2: Delete one saved report**

The older report is deleted through the existing confirmation flow.

- [x] **Step 3: Verify summary totals recalculate**

The saved-report summary should drop from `2개 보고서 · 출석 48명` to `1개 보고서 · 출석 34명`, and the department summary should also update.

### Task 58: Smoke Test Summary Stability After Canceling Deletion

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Import multiple saved reports**

Smoke test loads two saved reports with distinct attendance totals.

- [x] **Step 2: Start deletion and cancel it**

The delete confirmation dialog is opened for one report and then dismissed.

- [x] **Step 3: Verify summary totals stay unchanged**

The saved-report summary should remain `2개 보고서 · 출석 48명`, and the department summary should also remain unchanged.

### Task 59: Smoke Test Summary Stability After Copying To Draft

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Import saved reports and copy one into a draft**

Smoke test loads saved reports and uses the existing copy action to create a new unsaved draft.

- [x] **Step 2: Verify draft fields are populated**

The copied draft should keep the expected title and attendance values from the source report.

- [x] **Step 3: Verify saved-report summaries stay unchanged**

Because copying creates an unsaved draft only, the saved-report summary and department summary should keep the original totals.

### Task 60: Smoke Test Empty Summary After Final Deletion

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Import a single saved report**

Smoke test loads one saved report so the summary starts with a non-zero count and attendance total.

- [x] **Step 2: Delete the final saved report**

The only saved report is deleted through the existing confirmation flow.

- [x] **Step 3: Verify the empty summary state**

The saved-report empty state should appear, and both saved-report summary surfaces should disappear with the list emptied.

### Task 61: Smoke Test Zero Summary For Empty Search Results

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Filter saved reports down to zero matches**

Smoke test loads saved reports and enters a search query that matches none of them.

- [x] **Step 2: Verify the empty search-result message**

The history panel should show `검색 결과가 없습니다.`

- [x] **Step 3: Verify filtered summary totals drop to zero**

The saved-report summary should become `0개 보고서 · 출석 0명`, and the department summary should show zeros while the search filter is active.

### Task 62: Smoke Test Search Summary Restore After Clear

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Filter saved reports down to zero matches**

Smoke test loads saved reports and enters a search query that matches none of them.

- [x] **Step 2: Clear the search query**

The search input is reset back to an empty string without using the global filter reset button.

- [x] **Step 3: Verify the full summary returns**

The saved-report list, total summary, and department summary should all return to their original unfiltered values.

### Task 63: Smoke Test Zero Summary For Empty Month Filter

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Filter saved reports to a month with no matches**

Smoke test loads saved reports and enters a report month value with no matching saved reports.

- [x] **Step 2: Verify the empty search-result message**

The history panel should show `검색 결과가 없습니다.`

- [x] **Step 3: Verify filtered summary totals drop to zero**

The saved-report summary should become `0개 보고서 · 출석 0명`, and the visible department summary values should also drop to zeros while the month filter is active.

### Task 64: Smoke Test Month Summary Restore After Clear

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Filter saved reports to a month with no matches**

Smoke test loads saved reports and enters a report month value with no matching saved reports.

- [x] **Step 2: Clear the month filter**

The report month input is reset back to an empty string without using the global filter reset button.

- [x] **Step 3: Verify the full summary returns**

The saved-report list, total summary, and department summary should all return to their original unfiltered values.

### Task 65: Smoke Test Filter Reset Recovery From Zero Results

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Apply filters that produce zero results**

Smoke test loads saved reports, sets a month with no matches, and adds a search query so the history panel is clearly in a zero-result filtered state.

- [x] **Step 2: Trigger the global filter reset**

The `필터 초기화` button is used instead of manually clearing the inputs.

- [x] **Step 3: Verify the full list and summaries return**

Both filter inputs should clear, the saved-report list should fully reappear, and the saved-report summaries should return to the original totals.

### Task 66: Smoke Test Empty History Actions After Final Deletion

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Delete the only saved report**

Smoke test loads a single saved report and removes it through the existing confirmation flow.

- [x] **Step 2: Verify the empty history state**

The empty-state helper text should appear, and both summary surfaces should disappear.

- [x] **Step 3: Verify history-only actions also disappear**

The `전체 백업` action should no longer be shown once there are no saved reports left.

### Task 67: Smoke Test Filter Reset Button Visibility

**Files:**
- Update: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Verify no reset button in the default unfiltered state**

Smoke test loads saved reports and confirms `필터 초기화` is hidden before any filter is applied.

- [x] **Step 2: Verify the reset button appears while filters are active**

Applying either a search query or a report month filter should show the reset button.

- [x] **Step 3: Verify the reset button disappears again after clearing filters**

Once filters are cleared, the reset button should no longer be shown.

## Open Questions Before Implementation

1. Where is the current v1 report data stored?
2. Which fields must be preserved exactly for church reporting?
3. Should viewer mode be read-only local mode, shareable URL mode, or exported static HTML/PDF?
4. Is Korean-only UI enough for v2?
5. Should v2 support XLSX import immediately, or start with JSON and add XLSX after the schema is proven?
6. Do the four departments need separate offering/prayer/announcement fields, or only separate attendance and summary fields?
7. Will all reporters use the same internal device/app install, or do accounts need to sync across multiple devices?

## Recommended First Build Slice

Start with Phases 1-5 only. That creates the separate project, internal account model, versioned data model, migration contract, and shared report/viewer UI without pulling in heavier offline or import/export work too early.
