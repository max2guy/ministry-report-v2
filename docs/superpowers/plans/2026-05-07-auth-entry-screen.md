# Auth Entry Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logged-out auth gate with `로그인 / 계정 생성 / 계정 찾기` tabs so the report app opens to a dedicated sign-in experience before showing the editor.

**Architecture:** Keep the current account storage and validation logic, but move sign-in and sign-up into a dedicated `AuthGate` surface rendered by `App` before the main workspace. Add a small account lookup API and form for masked-email recovery hints while preserving the existing admin password recovery path.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, IndexedDB (`idb`)

---

## File Structure

- Modify: `Projects/ministry-report-v2/src/App.tsx`
  - Render the logged-out auth gate before the editor/viewer/history workspace, while keeping current account persistence and password-change behavior intact.
- Modify: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
  - Add a lookup helper for matching name + email and a masking helper for recovery display.
- Modify: `Projects/ministry-report-v2/src/features/auth/SignInForm.tsx`
  - Allow reuse inside the auth gate with optional heading/field label overrides if needed.
- Modify: `Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx`
  - Allow reuse inside the auth gate with optional heading/field label overrides if needed.
- Modify: `Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx`
  - Reduce this panel to the logged-in account summary and password-change surface only.
- Create: `Projects/ministry-report-v2/src/features/auth/AccountLookupForm.tsx`
  - Implement the account lookup form with masked-email feedback and admin recovery guidance.
- Create: `Projects/ministry-report-v2/src/features/auth/AuthGate.tsx`
  - Build the tabbed logged-out auth entry screen and wire it to sign-in, sign-up, and lookup actions.
- Modify: `Projects/ministry-report-v2/src/styles.css`
  - Add auth gate layout, tab, and dark-background styles while preserving current app surfaces.
- Modify: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`
  - Cover logged-out gate rendering, sign-in, sign-up auto-entry, and account lookup success/failure flows.

## Task 1: Add Account Lookup Support In Auth Store

**Files:**
- Modify: `Projects/ministry-report-v2/src/auth/internalAuthStore.ts`
- Test: `Projects/ministry-report-v2/src/auth/emailValidation.test.ts`

- [x] **Step 1: Extend the auth tests with lookup and masking expectations**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAccount,
  findAccountByNameAndEmail,
  maskEmail,
} from "./internalAuthStore";

describe("account lookup", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("ministry-report-v2-auth");
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "lookup-id"),
      subtle: crypto.subtle,
    });
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
```

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/auth/emailValidation.test.ts`
Expected: FAIL because `findAccountByNameAndEmail` and `maskEmail` do not exist yet.

- [x] **Step 3: Add minimal lookup and masking helpers**

```ts
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
    return `${localPart[0] ?? ""}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/auth/emailValidation.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/auth/internalAuthStore.ts Projects/ministry-report-v2/src/auth/emailValidation.test.ts
git commit -m "feat: add account lookup helpers"
```

## Task 2: Build The Account Lookup Form

**Files:**
- Create: `Projects/ministry-report-v2/src/features/auth/AccountLookupForm.tsx`
- Test: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add the failing smoke scenario for account lookup success and failure**

```ts
test("looks up an account and shows a masked email", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "계정 생성" }).click();
  await page.getByLabel("이름").fill("김우중");
  await page.getByLabel("이메일", { exact: true }).fill("lookup@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "계정 생성" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByRole("tab", { name: "계정 찾기" }).click();
  await page.getByLabel("이름").fill("김우중");
  await page.getByLabel("가입 이메일").fill("lookup@example.com");
  await page.getByRole("button", { name: "계정 확인" }).click();

  await expect(page.getByRole("status")).toContainText("ki***@example.com");
  await expect(page.getByText("비밀번호는 관리자 복구가 필요합니다.")).toBeVisible();
});
```

- [x] **Step 2: Run the targeted smoke test to verify it fails**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "looks up an account"`
Expected: FAIL because the auth gate and lookup form do not exist yet.

- [x] **Step 3: Create the lookup form component**

```tsx
import { useState, type FormEvent } from "react";
import {
  findAccountByNameAndEmail,
  maskEmail,
} from "../../auth/internalAuthStore";

export function AccountLookupForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const account = await findAccountByNameAndEmail({ displayName, email });
    if (!account) {
      setError("일치하는 계정을 찾지 못했습니다.");
      setMessage("");
      return;
    }

    setError("");
    setMessage(`가입 이메일: ${maskEmail(account.email)}`);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        이름
        <input value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
      </label>
      <label>
        가입 이메일
        <input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
      </label>
      <button type="submit">계정 확인</button>
      <p className="helper-text">비밀번호는 관리자 복구가 필요합니다.</p>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
```

- [x] **Step 4: Run the targeted smoke test to verify it passes**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "looks up an account"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/features/auth/AccountLookupForm.tsx Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts
git commit -m "feat: add account lookup form"
```

## Task 3: Build The Logged-Out Auth Gate Surface

**Files:**
- Create: `Projects/ministry-report-v2/src/features/auth/AuthGate.tsx`
- Modify: `Projects/ministry-report-v2/src/features/auth/SignInForm.tsx`
- Modify: `Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx`
- Modify: `Projects/ministry-report-v2/src/styles.css`

- [x] **Step 1: Add the failing smoke test for the auth gate first render**

```ts
test("shows a dedicated auth gate before login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "사역보고서 v2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "로그인" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});
```

- [x] **Step 2: Run the targeted smoke test to verify it fails**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "shows a dedicated auth gate before login"`
Expected: FAIL because the app still opens the editor directly.

- [x] **Step 3: Create the auth gate and reusable form framing**

```tsx
const AUTH_TABS = [
  { key: "signin", label: "로그인" },
  { key: "signup", label: "계정 생성" },
  { key: "lookup", label: "계정 찾기" },
] as const;

export function AuthGate({ onCreated, onSignedIn }: AuthGateProps) {
  const [tab, setTab] = useState<(typeof AUTH_TABS)[number]["key"]>("signin");

  return (
    <section className="auth-gate">
      <div className="auth-gate-panel">
        <p className="auth-gate-badge">연천장로교회</p>
        <h1>사역보고서 v2</h1>
        <p className="auth-gate-copy">로그인 후 사역보고서를 작성하고 확인할 수 있습니다.</p>
        <div className="auth-tabs" role="tablist" aria-label="인증 메뉴">
          {AUTH_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "signin" ? <SignInForm onSignedIn={onSignedIn} /> : null}
        {tab === "signup" ? <SignUpForm onCreated={onCreated} /> : null}
        {tab === "lookup" ? <AccountLookupForm /> : null}
      </div>
    </section>
  );
}
```

- [x] **Step 4: Add auth gate styles**

```css
.auth-gate {
  align-items: center;
  background: linear-gradient(180deg, #083949 0%, #0b4252 100%);
  display: grid;
  min-height: 100vh;
  padding: 24px;
}

.auth-gate-panel {
  background: rgb(8 37 48 / 82%);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 8px;
  display: grid;
  gap: 18px;
  margin: 0 auto;
  max-width: 440px;
  padding: 28px;
  width: 100%;
}

.auth-tabs {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
```

- [x] **Step 5: Run the targeted smoke test to verify it passes**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "shows a dedicated auth gate before login"`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add Projects/ministry-report-v2/src/features/auth/AuthGate.tsx Projects/ministry-report-v2/src/features/auth/SignInForm.tsx Projects/ministry-report-v2/src/features/auth/SignUpForm.tsx Projects/ministry-report-v2/src/styles.css Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts
git commit -m "feat: add tabbed auth gate"
```

## Task 4: Gate The App Until A User Signs In

**Files:**
- Modify: `Projects/ministry-report-v2/src/App.tsx`
- Modify: `Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx`
- Test: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add the failing smoke tests for sign-in entry and sign-up auto-entry**

```ts
test("enters the app after sign in", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "계정 생성" }).click();
  await page.getByLabel("이름").fill("김우중");
  await page.getByLabel("이메일", { exact: true }).fill("entry@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "계정 생성" }).click();

  await expect(page.getByLabel("보고서 입력")).toBeVisible();
  await expect(page.getByLabel("보고자 계정")).toContainText("김우중");
});
```

- [x] **Step 2: Run the targeted smoke test to verify it fails**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "enters the app after sign in"`
Expected: FAIL because the auth gate is not wired into `App` yet.

- [x] **Step 3: Split logged-out and logged-in rendering in App**

```tsx
if (!currentAccount) {
  return (
    <div className="app-shell">
      <AuthGate
        onCreated={handleAccountCreated}
        onSignedIn={handleAccountSignedIn}
      />
    </div>
  );
}

return (
  <div className="app-shell">
    <header className="top-bar">...</header>
    <main className="workspace">...</main>
  </div>
);
```

- [x] **Step 4: Reduce the reporter panel to logged-in account status**

```tsx
export function ReporterAccountPanel({ currentAccount, ...props }: ReporterAccountPanelProps) {
  if (!currentAccount) {
    return null;
  }

  return (
    <section className="account-panel" aria-label="보고자 계정">
      <h2>보고자 계정</h2>
      <div className="account-card">
        <strong>{currentAccount.displayName}</strong>
        <span>{currentAccount.email}</span>
        <button type="button" onClick={props.onSignOut}>로그아웃</button>
      </div>
      {currentAccount.status === "mustChangePassword" ? (
        <PasswordChangePanel account={currentAccount} onChanged={props.onAccountChanged} />
      ) : null}
    </section>
  );
}
```

- [x] **Step 5: Run the targeted smoke test to verify it passes**

Run: `npx playwright test tests/smoke/report-v2.spec.ts --grep "enters the app after sign in"`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add Projects/ministry-report-v2/src/App.tsx Projects/ministry-report-v2/src/features/auth/ReporterAccountPanel.tsx Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts
git commit -m "feat: gate app behind auth entry screen"
```

## Task 5: Run Full Regression And Polish Copy

**Files:**
- Modify: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`
- Modify: `Projects/ministry-report-v2/src/styles.css`

- [x] **Step 1: Add the remaining lookup failure and password-change regression coverage**

```ts
test("shows a generic error when account lookup fails", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "계정 찾기" }).click();
  await page.getByLabel("이름").fill("없는 사람");
  await page.getByLabel("가입 이메일").fill("missing@example.com");
  await page.getByRole("button", { name: "계정 확인" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "일치하는 계정을 찾지 못했습니다.",
  );
});
```

- [x] **Step 2: Run the full verification suite**

Run: `npm run verify`
Expected: PASS with unit tests, production build, and all smoke tests green.

- [x] **Step 3: Make any copy or spacing adjustments required by failing smoke selectors**

```css
.auth-gate-copy {
  color: rgb(255 255 255 / 76%);
  margin: 0;
}

.auth-form {
  display: grid;
  gap: 12px;
}
```

- [x] **Step 4: Re-run the full verification suite**

Run: `npm run verify`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/styles.css Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts
git commit -m "test: cover auth gate flows"
```
