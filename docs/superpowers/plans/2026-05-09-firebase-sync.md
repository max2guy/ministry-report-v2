# Firebase Auth + Firestore + GitHub Gist Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local IndexedDB auth with Firebase Auth (Google Sign-in) and sync all report/roster data to Firestore, with optional GitHub Gist backup for admins.

**Architecture:** Firebase Auth handles identity; Firestore is the primary data store (shared across devices); the existing IndexedDB stores remain as local cache. GitHub Gist (PAT stored in localStorage) is a secondary backup triggered on save. First user to sign in becomes admin automatically.

**Tech Stack:** Firebase SDK (firebase@11), Firestore, Firebase Auth (Google OAuth), GitHub Gist REST API, React 19, TypeScript, Vite env vars (`VITE_FIREBASE_*`)

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/firebase.ts` | Firebase app init, export `auth`, `db` singletons |
| `src/auth/firebaseAuthStore.ts` | `signInWithGoogle()`, `signOut()`, `onAuthChange()`, `getOrCreateUserDoc()` |
| `src/features/auth/GoogleSignInButton.tsx` | Google OAuth button + loading/error state |
| `src/storage/firestoreReportStore.ts` | Firestore CRUD for `reports/{id}` |
| `src/storage/firestoreRosterStore.ts` | Firestore CRUD for `roster/shared` |
| `src/features/sync/githubGistBackup.ts` | Gist upload (`uploadToGist`), PAT helpers |
| `src/features/sync/GithubSettingsPanel.tsx` | Admin UI: PAT input + Gist status |
| `src/features/sync/useSyncStatus.ts` | Hook: `"idle" | "saving" | "offline"` state |
| `firestore.rules` | Security rules |
| `firebase.json` | Firebase CLI project config |

### Modified files
| File | Change |
|------|--------|
| `src/auth/authTypes.ts` | Simplify `Account` — remove password fields, add `role` |
| `src/features/auth/AuthGate.tsx` | Replace 3-tab local auth with single Google Sign-in screen |
| `src/features/auth/ReporterAccountPanel.tsx` | Remove password change section |
| `src/features/report/ReportEditor.tsx` | Add `githubPanel?: ReactNode` prop slot |
| `src/App.tsx` | Wire Firebase auth, Firestore load/save, migration dialog, GitHub backup |
| `.github/workflows/deploy.yml` | Pass `VITE_FIREBASE_*` secrets as env vars |
| `vite.config.ts` | No change needed (env vars via `import.meta.env`) |

### Deleted files (Task 11)
- `src/auth/internalAuthStore.ts`
- `src/features/auth/PasswordChangePanel.tsx`
- `src/features/admin/AdminRecoveryManager.tsx`
- `src/features/auth/SignUpForm.tsx`
- `src/features/auth/SignInForm.tsx`
- `src/features/auth/AccountLookupForm.tsx`

---

## Task 1: Install Firebase SDK + Env Vars

**Files:**
- Modify: `package.json` (via npm install)
- Create: `.env.local`
- Create: `src/lib/firebase.ts`

- [ ] **Step 1: Install firebase**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm install firebase
```

Expected: `firebase` added to `dependencies` in package.json.

- [ ] **Step 2: Create `.env.local`**

Create the file `/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2/.env.local` with:

```
VITE_FIREBASE_API_KEY=AIzaSyBMSjFAkSvT1ZXaOSvrcFkKC-j-eIgAyXo
VITE_FIREBASE_AUTH_DOMAIN=ministry-report-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ministry-report-v2
VITE_FIREBASE_STORAGE_BUCKET=ministry-report-v2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=336428867981
VITE_FIREBASE_APP_ID=1:336428867981:web:91a8c9766c14e7d738ddc4
```

- [ ] **Step 3: Create `src/lib/firebase.ts`**

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore 오프라인 퍼시스턴스 활성화 (한 번만 호출)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // 탭 여러 개 열려있음 — 오프라인 퍼시스턴스는 하나의 탭에서만 동작
    console.warn("Firestore offline persistence: multiple tabs open");
  } else if (err.code === "unimplemented") {
    // 브라우저 미지원
    console.warn("Firestore offline persistence not available");
  }
});
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to `src/lib/firebase.ts`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add package.json package-lock.json src/lib/firebase.ts .env.local
git commit -m "feat: install firebase sdk and initialize app"
```

---

## Task 2: Update `authTypes.ts` — Simplified Account Type

**Files:**
- Modify: `src/auth/authTypes.ts`

- [ ] **Step 1: Replace authTypes.ts**

```typescript
export type UserRole = "reporter" | "admin";

export type Account = {
  id: string;          // Firebase uid
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: Check for type errors from removed fields**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep -v "node_modules"
```

Expected: Errors referencing `passwordSalt`, `passwordHash`, `status`, `mustChangePassword`. These will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/auth/authTypes.ts
git commit -m "refactor: simplify Account type for Firebase Auth"
```

---

## Task 3: Create `firebaseAuthStore.ts`

**Files:**
- Create: `src/auth/firebaseAuthStore.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { Account, UserRole } from "./authTypes";

const provider = new GoogleAuthProvider();

/** Firestore users/{uid} 문서를 읽거나 없으면 생성 */
export async function getOrCreateUserDoc(user: User): Promise<Account> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? data.displayName ?? "",
      role: (data.role as UserRole) ?? "reporter",
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string,
    };
  }

  // 첫 사용자인지 확인 (users 컬렉션이 비어있으면 admin)
  const { getDocs, collection } = await import("firebase/firestore");
  const allUsers = await getDocs(collection(db, "users"));
  const role: UserRole = allUsers.empty ? "admin" : "reporter";

  const now = new Date().toISOString();
  const account: Account = {
    id: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    role,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, {
    displayName: account.displayName,
    email: account.email,
    role: account.role,
    createdAt: now,
    updatedAt: now,
  });

  return account;
}

/** Google 팝업 로그인 → Account 반환 */
export async function signInWithGoogle(): Promise<Account> {
  const result = await signInWithPopup(auth, provider);
  return getOrCreateUserDoc(result.user);
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Auth 상태 변경 구독 */
export function onAuthChange(
  callback: (account: Account | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const account = await getOrCreateUserDoc(user);
      callback(account);
    } catch {
      callback(null);
    }
  });
}

/** displayName 업데이트 */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { displayName, updatedAt: new Date().toISOString() });
}
```

- [ ] **Step 2: Verify no compile errors**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep "firebaseAuthStore" | head -20
```

Expected: No errors in `firebaseAuthStore.ts`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/auth/firebaseAuthStore.ts
git commit -m "feat: add Firebase Auth store with Google sign-in"
```

---

## Task 4: Create `GoogleSignInButton.tsx` + Update `AuthGate.tsx`

**Files:**
- Create: `src/features/auth/GoogleSignInButton.tsx`
- Modify: `src/features/auth/AuthGate.tsx`

- [ ] **Step 1: Create GoogleSignInButton.tsx**

```typescript
import { useState } from "react";
import { signInWithGoogle } from "../../auth/firebaseAuthStore";
import type { Account } from "../../auth/authTypes";

type Props = {
  onSignedIn: (account: Account) => void;
};

export function GoogleSignInButton({ onSignedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const account = await signInWithGoogle();
      onSignedIn(account);
    } catch (err) {
      console.error(err);
      setError("로그인에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="google-signin-wrapper">
      <button
        type="button"
        className="btn-google-signin"
        onClick={() => void handleClick()}
        disabled={loading}
      >
        {loading ? (
          "로그인 중..."
        ) : (
          <>
            <GoogleIcon />
            Google로 로그인
          </>
        )}
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
```

- [ ] **Step 2: Replace AuthGate.tsx with Google Sign-in only**

```typescript
import type { Account } from "../../auth/authTypes";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthGateProps = {
  onCreated: (account: Account) => void;
  onSignedIn: (account: Account) => void;
};

export function AuthGate({ onSignedIn }: AuthGateProps) {
  // onCreated는 이제 onSignedIn과 동일 (Google 로그인 시 자동 계정 생성)
  return (
    <section className="auth-gate">
      <div className="auth-gate-panel">
        <p className="auth-gate-badge">연천장로교회</p>
        <h1>사역보고서 v2</h1>
        <p className="auth-gate-copy">
          Google 계정으로 로그인하면 어느 기기에서든 보고서를 확인할 수 있습니다.
        </p>
        <GoogleSignInButton onSignedIn={onSignedIn} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify no compile errors**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: Errors only about removed files (`internalAuthStore`, `PasswordChangePanel`, etc.) — not about the new auth files.

- [ ] **Step 4: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/features/auth/GoogleSignInButton.tsx src/features/auth/AuthGate.tsx
git commit -m "feat: replace local auth UI with Google Sign-in"
```

---

## Task 5: Create Firestore Report Store

**Files:**
- Create: `src/storage/firestoreReportStore.ts`

- [ ] **Step 1: Create firestoreReportStore.ts**

```typescript
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MinistryReport } from "../domain/reportTypes";

const COLLECTION = "reports";

export async function firestoreListReports(): Promise<MinistryReport[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as MinistryReport);
}

export async function firestoreSaveReport(report: MinistryReport): Promise<void> {
  const ref = doc(db, COLLECTION, report.id);
  await setDoc(ref, report);
}

export async function firestoreSaveReports(reports: MinistryReport[]): Promise<void> {
  const batch = writeBatch(db);
  for (const report of reports) {
    const ref = doc(db, COLLECTION, report.id);
    batch.set(ref, report);
  }
  await batch.commit();
}

export async function firestoreDeleteReport(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
```

- [ ] **Step 2: Verify compile**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep "firestoreReportStore" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/storage/firestoreReportStore.ts
git commit -m "feat: add Firestore report store"
```

---

## Task 6: Create Firestore Roster Store

**Files:**
- Create: `src/storage/firestoreRosterStore.ts`

- [ ] **Step 1: Create firestoreRosterStore.ts**

```typescript
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MemberRoster } from "../domain/memberRoster";

const DOC_PATH = "roster/shared";

export async function firestoreLoadRoster(): Promise<MemberRoster | undefined> {
  const snap = await getDoc(doc(db, DOC_PATH));
  if (!snap.exists()) return undefined;
  return snap.data() as MemberRoster;
}

export async function firestoreSaveRoster(roster: MemberRoster): Promise<void> {
  await setDoc(doc(db, DOC_PATH), roster);
}
```

- [ ] **Step 2: Verify compile**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep "firestoreRosterStore" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/storage/firestoreRosterStore.ts
git commit -m "feat: add Firestore roster store"
```

---

## Task 7: Create GitHub Gist Backup

**Files:**
- Create: `src/features/sync/githubGistBackup.ts`
- Create: `src/features/sync/GithubSettingsPanel.tsx`

- [ ] **Step 1: Create githubGistBackup.ts**

```typescript
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { MinistryReport } from "../../domain/reportTypes";
import type { MemberRoster } from "../../domain/memberRoster";

const PAT_KEY = "github-gist-pat";
const GIST_ID_DOC = "settings/github";

export function getStoredPat(): string {
  return localStorage.getItem(PAT_KEY) ?? "";
}

export function storePat(pat: string): void {
  if (pat) {
    localStorage.setItem(PAT_KEY, pat);
  } else {
    localStorage.removeItem(PAT_KEY);
  }
}

export async function getStoredGistId(): Promise<string> {
  const snap = await getDoc(doc(db, GIST_ID_DOC));
  return snap.exists() ? (snap.data().gistId as string) ?? "" : "";
}

async function storeGistId(gistId: string): Promise<void> {
  await setDoc(doc(db, GIST_ID_DOC), {
    gistId,
    updatedAt: new Date().toISOString(),
  });
}

type GistPayload = {
  reports: MinistryReport[];
  roster: MemberRoster | undefined;
};

/** Gist 업로드. PAT 없으면 no-op. 실패해도 에러를 던지지 않음. */
export async function uploadToGist(payload: GistPayload): Promise<void> {
  const pat = getStoredPat();
  if (!pat) return;

  const gistId = await getStoredGistId().catch(() => "");
  const files = {
    "reports.json": { content: JSON.stringify(payload.reports, null, 2) },
    "roster.json": { content: JSON.stringify(payload.roster ?? {}, null, 2) },
  };

  try {
    if (gistId) {
      // 기존 Gist 업데이트
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });
    } else {
      // 새 Gist 생성
      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "사역보고서 v2 백업",
          public: false,
          files,
        }),
      });
      const data = (await res.json()) as { id: string };
      if (data.id) {
        await storeGistId(data.id);
      }
    }
  } catch (err) {
    // Gist 업로드 실패는 무시 (Firestore 저장은 완료된 상태)
    console.warn("GitHub Gist backup failed:", err);
  }
}

/** PAT 유효성 검증 */
export async function validatePat(pat: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${pat}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Create GithubSettingsPanel.tsx**

```typescript
import { useState, useEffect } from "react";
import {
  getStoredPat,
  storePat,
  getStoredGistId,
  validatePat,
} from "./githubGistBackup";

export function GithubSettingsPanel() {
  const [pat, setPat] = useState(getStoredPat());
  const [gistId, setGistId] = useState("");
  const [status, setStatus] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    getStoredGistId()
      .then(setGistId)
      .catch(() => setGistId(""));
  }, []);

  async function handleSavePat() {
    setValidating(true);
    setStatus("");
    const valid = await validatePat(pat);
    if (valid) {
      storePat(pat);
      setStatus("✓ PAT 저장됨");
    } else {
      setStatus("✗ PAT가 유효하지 않습니다.");
    }
    setValidating(false);
  }

  return (
    <section className="github-settings-panel" aria-label="GitHub 백업 설정">
      <h2>GitHub 백업 설정 (관리자)</h2>
      <div className="github-settings-row">
        <label htmlFor="github-pat">PAT</label>
        <input
          id="github-pat"
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="ghp_..."
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => void handleSavePat()}
          disabled={validating || !pat}
        >
          {validating ? "확인 중..." : "저장"}
        </button>
      </div>
      {gistId && (
        <p className="github-gist-id">
          Gist: <code>{gistId.slice(0, 8)}…</code> ✓ 연결됨
        </p>
      )}
      {status && <p role="status" className="github-status">{status}</p>}
    </section>
  );
}
```

- [ ] **Step 3: Verify compile**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep -E "githubGist|GithubSettings" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/features/sync/githubGistBackup.ts src/features/sync/GithubSettingsPanel.tsx
git commit -m "feat: add GitHub Gist backup and admin settings panel"
```

---

## Task 8: Update `ReporterAccountPanel.tsx` + `ReportEditor.tsx`

**Files:**
- Modify: `src/features/auth/ReporterAccountPanel.tsx`
- Modify: `src/features/report/ReportEditor.tsx`

- [ ] **Step 1: Simplify ReporterAccountPanel.tsx**

```typescript
import type { Account } from "../../auth/authTypes";

type ReporterAccountPanelProps = {
  currentAccount?: Account;
  onSignOut: () => void;
};

export function ReporterAccountPanel({
  currentAccount,
  onSignOut,
}: ReporterAccountPanelProps) {
  if (!currentAccount) return null;

  return (
    <section className="account-panel" aria-label="보고자 계정">
      <h2>보고자 계정</h2>
      <div className="account-card">
        <strong>{currentAccount.displayName}</strong>
        <span>{currentAccount.email}</span>
        <button type="button" onClick={onSignOut}>
          로그아웃
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add `githubPanel` prop to ReportEditor.tsx**

Read the current file first, then add the prop. The change is minimal — add one prop:

```typescript
// Add to ReportEditorProps type:
  githubPanel?: ReactNode;

// Add after historyPanel in JSX (inside <aside className="edit-panel">):
        {githubPanel}
```

The full updated ReportEditor.tsx type and render:

```typescript
import type { ReactNode } from "react";
import type { MinistryReport } from "../../domain/reportTypes";
import { TabbedReportForm } from "./TabbedReportForm";

type ReportEditorProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  accountPanel: ReactNode;
  canSave: boolean;
  historyPanel: ReactNode;
  importPanel: ReactNode;
  githubPanel?: ReactNode;
  onChange: (report: MinistryReport) => void;
  onNewReport: () => void;
  onSave: () => void;
  saveErrors: string[];
  saveStatus: string;
  saveDisabledReason?: string;
};
```

Add `{githubPanel}` inside the `<aside className="edit-panel">` after `{historyPanel}`.

- [ ] **Step 3: Verify compile**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "internalAuthStore\|PasswordChangePanel\|AdminRecoveryManager\|SignUpForm\|SignInForm\|AccountLookupForm" | head -30
```

Expected: No errors except those from files we haven't deleted yet.

- [ ] **Step 4: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/features/auth/ReporterAccountPanel.tsx src/features/report/ReportEditor.tsx
git commit -m "refactor: simplify account panel, add githubPanel slot to editor"
```

---

## Task 9: Rewrite `App.tsx` with Firebase Auth + Firestore

**Files:**
- Modify: `src/App.tsx`

This is the largest change. The full rewritten App.tsx:

- [ ] **Step 1: Write the new App.tsx**

```typescript
import { useEffect, useState, useCallback } from "react";
import type { Account } from "./auth/authTypes";
import { onAuthChange, signOut as firebaseSignOut } from "./auth/firebaseAuthStore";
import { ThemeSelector } from "./features/theme/ThemeSelector";
import { applyTheme, getStoredTheme } from "./features/theme/useTheme";
import { createDefaultRoster, mergeRosterFromReport, type MemberRoster } from "./domain/memberRoster";
import {
  cloneReportAsDraft,
  createEmptyReport,
  type MinistryReport,
  upgradeReportForEditor,
} from "./domain/reportTypes";
import { validateReportForSave } from "./domain/reportValidation";
import { useInstallPrompt } from "./features/pwa/useInstallPrompt";
import { AuthGate } from "./features/auth/AuthGate";
import { ReporterAccountPanel } from "./features/auth/ReporterAccountPanel";
import { LegacyImportPanel } from "./features/import/LegacyImportPanel";
import { ReportEditor } from "./features/report/ReportEditor";
import { ReportHistoryPanel } from "./features/report/ReportHistoryPanel";
import { ReportViewer } from "./features/report/ReportViewer";
import { MemberRosterTab } from "./features/roster/MemberRosterTab";
import { GithubSettingsPanel } from "./features/sync/GithubSettingsPanel";
import { uploadToGist } from "./features/sync/githubGistBackup";
import { readReportDraft, saveReportDraft } from "./storage/reportDraftStore";
import {
  firestoreListReports,
  firestoreSaveReport,
  firestoreSaveReports,
  firestoreDeleteReport,
} from "./storage/firestoreReportStore";
import {
  firestoreLoadRoster,
  firestoreSaveRoster,
} from "./storage/firestoreRosterStore";
import {
  listReports as localListReports,
  saveReport as localSaveReport,
  saveReports as localSaveReports,
} from "./storage/reportStore";
import { loadRoster as localLoadRoster } from "./storage/memberRosterStore";

/** roster 변경 시 현재 report의 members/zones를 동기화 (기존 출석 상태는 유지) */
function syncReportFromRoster(
  report: MinistryReport,
  roster: MemberRoster,
): MinistryReport {
  const departments = { ...report.departments };

  for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
    const rDept = roster.departments[key];
    if (rDept.kind !== "flat") continue;
    const rMembers = rDept.members;
    const existing = departments[key].members ?? [];
    const existingMap = new Map(existing.map((m) => [m.id, m]));
    const members = rMembers.map((rm) => {
      const existing = existingMap.get(rm.id);
      return existing
        ? { ...existing, id: rm.id, name: rm.name, group: rm.group }
        : { id: rm.id, name: rm.name, status: "absent" as const, group: rm.group };
    });
    departments[key] = { ...departments[key], members };
  }

  const rAdult = roster.departments.adult;
  if (rAdult.kind === "zoned") {
    const existingZones = departments.adult.zones ?? [];
    const existingById = new Map(existingZones.map((z) => [z.id, z]));
    const existingByName = new Map(existingZones.map((z) => [z.name, z]));
    const zones = rAdult.zones.map((rz) => {
      const existingZone = existingById.get(rz.id) ?? existingByName.get(rz.name);
      const existingMemberById = new Map((existingZone?.members ?? []).map((m) => [m.id, m]));
      const existingMemberByName = new Map((existingZone?.members ?? []).map((m) => [m.name, m]));
      const members = rz.members.map((rm) => {
        const existing = existingMemberById.get(rm.id) ?? existingMemberByName.get(rm.name);
        return existing
          ? { ...existing, id: rm.id, name: rm.name }
          : { id: rm.id, name: rm.name, status: "absent" as const };
      });
      return { id: rz.id, name: rz.name, district: rz.district, members };
    });
    const attendance = zones.reduce(
      (sum, z) => sum + z.members.filter((m) => m.status === "present").length,
      0,
    );
    departments.adult = { ...departments.adult, zones, attendance };
  }

  return { ...report, departments, updatedAt: new Date().toISOString() };
}

function latestReport(reports: MinistryReport[]): MinistryReport | undefined {
  return sortReports(reports)[0];
}

function sortReports(reports: MinistryReport[]): MinistryReport[] {
  return reports.slice().sort((a, b) => {
    const dateOrder = b.reportDate.localeCompare(a.reportDate);
    return dateOrder || b.updatedAt.localeCompare(a.updatedAt);
  });
}

function mergeReports(
  currentReports: MinistryReport[],
  nextReports: MinistryReport[],
): MinistryReport[] {
  const byId = new Map(currentReports.map((item) => [item.id, item]));
  nextReports.forEach((item) => byId.set(item.id, item));
  return sortReports([...byId.values()]);
}

function reportWithAccount(
  report: MinistryReport,
  account: Account,
): MinistryReport {
  return {
    ...report,
    pastorName: account.displayName,
    updatedAt: new Date().toISOString(),
  };
}

export function App() {
  useEffect(() => { applyTheme(getStoredTheme()); }, []);

  const { state: installState, triggerInstall } = useInstallPrompt();

  const [mode, setMode] = useState<"edit" | "view" | "roster">("edit");
  const [roster, setRoster] = useState<MemberRoster | undefined>();
  const [report, setReport] = useState(() => createEmptyReport());
  const [reports, setReports] = useState<MinistryReport[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [pendingMigrationData, setPendingMigrationData] = useState<{
    reports: MinistryReport[];
    roster: MemberRoster | undefined;
  } | null>(null);

  // Firebase Auth 상태 구독
  useEffect(() => {
    const unsubscribe = onAuthChange((account) => {
      if (!account) {
        setCurrentAccount(undefined);
        setIsHydrated(true);
        return;
      }
      setCurrentAccount(account);
      void loadCloudData(account);
    });
    return unsubscribe;
  }, []);

  async function loadCloudData(account: Account) {
    try {
      const [cloudReports, cloudRoster] = await Promise.all([
        firestoreListReports(),
        firestoreLoadRoster(),
      ]);

      const draft = readReportDraft();

      // 마이그레이션 확인: IndexedDB에 기존 데이터가 있고 Firestore는 비어있는 경우
      if (cloudReports.length === 0) {
        const localReports = await localListReports();
        const localRoster = await localLoadRoster(account.email);
        if (localReports.length > 0) {
          setPendingMigrationData({ reports: localReports, roster: localRoster });
          setShowMigrationDialog(true);
          const nextReport = draft ?? latestReport(localReports) ?? createEmptyReport();
          const upgraded = upgradeReportForEditor(nextReport);
          setReport(account ? reportWithAccount(upgraded, account) : upgraded);
          setRoster(localRoster);
          setReports(sortReports(localReports));
          setIsHydrated(true);
          return;
        }
      }

      const storedRoster = cloudRoster ?? createDefaultRoster();
      const latest = latestReport(cloudReports);
      const initialReport = draft ?? latest;

      setReports(sortReports(cloudReports));
      setRoster(storedRoster);
      if (initialReport) {
        const upgraded = upgradeReportForEditor(initialReport);
        setReport(
          account && !upgraded.pastorName
            ? reportWithAccount(upgraded, account)
            : upgraded,
        );
      }
      setIsHydrated(true);
    } catch (err) {
      console.error("Failed to load cloud data:", err);
      setSaveStatus("데이터 로드 실패. 오프라인 상태일 수 있습니다.");
      setIsHydrated(true);
    }
  }

  async function handleMigrate() {
    if (!pendingMigrationData) return;
    const { reports: localReports, roster: localRoster } = pendingMigrationData;
    await firestoreSaveReports(localReports);
    if (localRoster) await firestoreSaveRoster(localRoster);
    setShowMigrationDialog(false);
    setPendingMigrationData(null);
    setSaveStatus(`${localReports.length}개 보고서를 클라우드로 이전했습니다.`);
  }

  function handleMigrationSkip() {
    setShowMigrationDialog(false);
    setPendingMigrationData(null);
  }

  function handleSignedIn(account: Account) {
    setCurrentAccount(account);
    setSaveStatus(`${account.displayName}으로 로그인되었습니다.`);
  }

  async function handleSignOut() {
    await firebaseSignOut();
    setCurrentAccount(undefined);
    setReports([]);
    setRoster(undefined);
    setReport(createEmptyReport());
    setSaveStatus("로그아웃되었습니다.");
    setMode("edit");
    setIsHydrated(true);
  }

  function handleReportChange(nextReport: MinistryReport) {
    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(nextReport);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);

    setRoster(prev => {
      if (!prev) return prev;
      let nextDepts = { ...prev.departments };
      let changed = false;

      for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
        const rDept = prev.departments[key];
        if (rDept.kind !== "flat") continue;

        const reportMembers = upgradedReport.departments[key].members ?? [];
        const reportById = new Map(reportMembers.map(m => [m.id, m]));
        const rosterById = new Map(rDept.members.map(m => [m.id, m]));

        const toAdd = reportMembers.filter(m => !rosterById.has(m.id));
        const removeIds = new Set(rDept.members.filter(m => !reportById.has(m.id)).map(m => m.id));

        let rosterMembers = rDept.members
          .filter(m => !removeIds.has(m.id))
          .map(m => {
            const rm = reportById.get(m.id);
            return rm && rm.group !== m.group ? { ...m, group: rm.group } : m;
          });

        for (const m of toAdd) {
          rosterMembers = [...rosterMembers, { id: m.id, name: m.name, ...(m.group ? { group: m.group } : {}) }];
        }

        if (toAdd.length > 0 || removeIds.size > 0 ||
            rDept.members.some(m => { const rm = reportById.get(m.id); return rm && rm.group !== m.group; })) {
          nextDepts = { ...nextDepts, [key]: { kind: "flat", members: rosterMembers } };
          changed = true;
        }
      }

      const reportAdult = upgradedReport.departments.adult;
      const rAdult = prev.departments.adult;
      if (rAdult.kind === "zoned" && reportAdult.zones) {
        const rosterZoneById = new Map(rAdult.zones.map(z => [z.id, z]));
        let adultChanged = false;
        const newRosterZones = reportAdult.zones.map(reportZone => {
          const rosterZone = rosterZoneById.get(reportZone.id);
          const rosterMemberById = new Map((rosterZone?.members ?? []).map(m => [m.id, m]));
          const newMembers = reportZone.members.map(rm =>
            rosterMemberById.get(rm.id) ?? { id: rm.id, name: rm.name },
          );
          const oldIds = (rosterZone?.members ?? []).map(m => m.id).join(",");
          const newIds = newMembers.map(m => m.id).join(",");
          if (oldIds !== newIds) adultChanged = true;
          return { ...(rosterZone ?? { id: reportZone.id, name: reportZone.name, district: reportZone.district }), members: newMembers };
        });
        if (adultChanged) {
          nextDepts = { ...nextDepts, adult: { kind: "zoned", zones: newRosterZones } };
          changed = true;
        }
      }

      if (!changed) return prev;
      const nextRoster: MemberRoster = { ...prev, departments: nextDepts, updatedAt: new Date().toISOString() };
      void firestoreSaveRoster(nextRoster);
      return nextRoster;
    });
  }

  async function handleSave() {
    if (!currentAccount) {
      setSaveStatus("로그인 후 저장할 수 있습니다.");
      return;
    }

    const reportToSave = reportWithAccount(report, currentAccount);
    const validationErrors = validateReportForSave(reportToSave);

    if (validationErrors.length) {
      setSaveErrors(validationErrors);
      setSaveStatus(validationErrors[0]);
      return;
    }

    setSaveStatus("저장 중...");
    await firestoreSaveReport(reportToSave);
    // 로컬 캐시도 저장 (오프라인 복구용)
    await localSaveReport(reportToSave);

    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(reportToSave);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);
    setReports((currentReports) => mergeReports(currentReports, [upgradedReport]));
    setSaveStatus(`${currentAccount.displayName}으로 저장되었습니다.`);

    // GitHub Gist 백업 (PAT 있을 때만, 실패해도 무시)
    void uploadToGist({ reports: mergeReports(reports, [upgradedReport]), roster });
  }

  function handleNewReport() {
    const nextReport = createEmptyReport(new Date(), roster);
    const draft = currentAccount
      ? reportWithAccount(nextReport, currentAccount)
      : nextReport;
    setReport(draft);
    saveReportDraft(draft);
    setSaveErrors([]);
    setSaveStatus("새 보고서를 만들었습니다.");
  }

  function handleRosterChange(nextRoster: MemberRoster) {
    setRoster(nextRoster);
    void firestoreSaveRoster(nextRoster);
    setReport((currentReport) => {
      const next = syncReportFromRoster(currentReport, nextRoster);
      saveReportDraft(next);
      return next;
    });
  }

  function handleLoadReport(storedReport: MinistryReport) {
    const upgradedReport = upgradeReportForEditor(storedReport);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);
    setSaveErrors([]);
    setSaveStatus(`${storedReport.reportDate} 보고서를 불러왔습니다.`);
  }

  function handleDuplicateReport(storedReport: MinistryReport) {
    const duplicate = cloneReportAsDraft(storedReport);
    const draft = currentAccount
      ? reportWithAccount(duplicate, currentAccount)
      : duplicate;
    setReport(draft);
    saveReportDraft(draft);
    setSaveErrors([]);
    setSaveStatus(`${storedReport.reportDate} 보고서를 복사해 새 보고서를 만들었습니다.`);
  }

  async function handleDeleteReport(storedReport: MinistryReport) {
    await firestoreDeleteReport(storedReport.id);
    const nextReports = reports.filter((item) => item.id !== storedReport.id);
    const nextReport = upgradeReportForEditor(
      latestReport(nextReports) ?? createEmptyReport(),
    );
    setReports(nextReports);
    if (report.id === storedReport.id) {
      setReport(nextReport);
      saveReportDraft(nextReport);
    }
    setSaveStatus(`${storedReport.reportDate} 보고서를 삭제했습니다.`);
  }

  async function handleImport(
    importedReports: MinistryReport[],
    warnings: string[],
  ) {
    setImportWarnings(warnings);

    if (!importedReports.length) {
      setSaveStatus("가져올 보고서가 없습니다.");
      return;
    }

    await firestoreSaveReports(importedReports);
    await localSaveReports(importedReports);

    const latest = latestReport(importedReports);
    if (latest) {
      const upgradedReport = upgradeReportForEditor(latest);
      setReport(upgradedReport);
      saveReportDraft(upgradedReport);

      setRoster((prev) => {
        const nextRoster = mergeRosterFromReport(prev, latest);
        void firestoreSaveRoster(nextRoster);
        return nextRoster;
      });
    }

    setReports((currentReports) =>
      mergeReports(currentReports, importedReports),
    );
    setSaveStatus(
      warnings.length
        ? `${importedReports.length}개 보고서를 가져왔습니다. ${warnings.length}개 경고가 있습니다.`
        : `${importedReports.length}개 보고서를 가져왔습니다. 명단도 업데이트되었습니다.`,
    );
  }

  function handleImportError(message: string) {
    setImportWarnings([]);
    setSaveErrors([]);
    setSaveStatus(message);
  }

  async function handleForceRefresh() {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
  }

  if (!isHydrated) {
    return <main className="app-shell" />;
  }

  if (!currentAccount) {
    return (
      <main className="app-shell auth-shell">
        <AuthGate
          onCreated={handleSignedIn}
          onSignedIn={handleSignedIn}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {showMigrationDialog && (
        <div className="migration-dialog-overlay">
          <div className="migration-dialog">
            <h2>기존 데이터 이전</h2>
            <p>
              이 기기에 저장된 보고서 {pendingMigrationData?.reports.length ?? 0}개를
              클라우드로 이전하시겠습니까?
            </p>
            <div className="migration-dialog-actions">
              <button type="button" className="btn-primary" onClick={() => void handleMigrate()}>
                이전하기
              </button>
              <button type="button" onClick={handleMigrationSkip}>
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="top-bar">
        <div className="top-bar-title-row">
          <h1>사역보고서 v2</h1>
          {installState === "ready" && (
            <button
              type="button"
              className="btn-pwa-install"
              onClick={() => void triggerInstall()}
              aria-label="앱 설치"
            >
              📲 설치
            </button>
          )}
          {installState === "installed" && (
            <span className="pwa-installed-badge" aria-label="앱 설치됨">✓ 설치됨</span>
          )}
          <button
            type="button"
            className="btn-force-refresh"
            onClick={() => void handleForceRefresh()}
            title="앱 강제 새로고침 (캐시 초기화)"
            aria-label="강제 새로고침"
          >
            🔄
          </button>
        </div>
        <ThemeSelector />
        <div className="segmented-control" aria-label="보기 모드">
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            보고서
          </button>
          <button
            type="button"
            aria-pressed={mode === "view"}
            onClick={() => setMode("view")}
          >
            뷰어
          </button>
          <button
            type="button"
            aria-pressed={mode === "roster"}
            onClick={() => setMode("roster")}
          >
            명단관리
          </button>
        </div>
      </header>
      {mode === "edit" ? (
        <ReportEditor
          report={report}
          reports={reports}
          accountPanel={
            <ReporterAccountPanel
              currentAccount={currentAccount}
              onSignOut={() => void handleSignOut()}
            />
          }
          canSave={!!currentAccount}
          importPanel={
            <LegacyImportPanel
              warnings={importWarnings}
              onImport={handleImport}
              onImportError={handleImportError}
            />
          }
          historyPanel={
            <ReportHistoryPanel
              reports={reports}
              currentReportId={report.id}
              onDelete={handleDeleteReport}
              onDuplicate={handleDuplicateReport}
              onLoad={handleLoadReport}
            />
          }
          githubPanel={
            currentAccount.role === "admin" ? <GithubSettingsPanel /> : undefined
          }
          onChange={handleReportChange}
          onNewReport={handleNewReport}
          onSave={handleSave}
          saveErrors={saveErrors}
          saveStatus={saveStatus}
          saveDisabledReason="로그인 후 저장할 수 있습니다."
        />
      ) : mode === "roster" ? (
        <main className="roster-shell">
          {roster && (
            <MemberRosterTab
              roster={roster}
              onChange={handleRosterChange}
            />
          )}
        </main>
      ) : (
        <ReportViewer report={report} reports={reports} />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify compile (ignoring deleted files)**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "internalAuthStore\|PasswordChangePanel\|AdminRecoveryManager\|SignUpForm\|SignInForm\|AccountLookupForm" | head -30
```

Expected: Only errors from the not-yet-deleted legacy files, not from App.tsx itself.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/App.tsx
git commit -m "feat: wire Firebase Auth + Firestore into App, add migration dialog"
```

---

## Task 10: Add CSS for New UI Elements

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add styles for Google sign-in, migration dialog, and GitHub panel**

Append to `src/styles.css`:

```css
/* ── Google Sign-in ────────────────────────────── */
.google-signin-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.btn-google-signin {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  color: #3c4043;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  padding: 10px 24px;
  cursor: pointer;
  min-width: 220px;
  justify-content: center;
  transition: background 0.15s, box-shadow 0.15s;
}

.btn-google-signin:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.btn-google-signin:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-error {
  color: var(--clr-error, #d93025);
  font-size: 13px;
  text-align: center;
}

/* ── Migration Dialog ─────────────────────────── */
.migration-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.migration-dialog {
  background: var(--clr-surface, #ffffff);
  border-radius: 12px;
  padding: 24px;
  max-width: 360px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 32px rgb(0 0 0 / 24%);
}

.migration-dialog h2 {
  font-size: 18px;
  margin-bottom: 12px;
}

.migration-dialog p {
  font-size: 14px;
  color: var(--clr-text-secondary, #666);
  margin-bottom: 20px;
}

.migration-dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  background: var(--clr-accent, #1a73e8);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
}

/* ── GitHub Settings Panel ───────────────────── */
.github-settings-panel {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--clr-border, #e0e0e0);
  border-radius: 8px;
}

.github-settings-panel h2 {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--clr-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.github-settings-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.github-settings-row label {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.github-settings-row input {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid var(--clr-border, #e0e0e0);
  border-radius: 6px;
  background: var(--clr-surface, #fff);
  color: var(--clr-text, #222);
}

.github-gist-id {
  font-size: 12px;
  color: var(--clr-text-secondary, #666);
  margin-top: 8px;
}

.github-status {
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
}
```

- [ ] **Step 2: Verify dev build**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or only errors from legacy files we haven't deleted yet).

- [ ] **Step 3: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/styles.css
git commit -m "style: add Google sign-in, migration dialog, GitHub settings styles"
```

---

## Task 11: Delete Legacy Auth Files

**Files:**
- Delete: `src/auth/internalAuthStore.ts`
- Delete: `src/features/auth/PasswordChangePanel.tsx`
- Delete: `src/features/admin/AdminRecoveryManager.tsx`
- Delete: `src/features/auth/SignUpForm.tsx`
- Delete: `src/features/auth/SignInForm.tsx`
- Delete: `src/features/auth/AccountLookupForm.tsx`

- [ ] **Step 1: Delete legacy files**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
rm src/auth/internalAuthStore.ts
rm src/features/auth/PasswordChangePanel.tsx
rm src/features/admin/AdminRecoveryManager.tsx
rm src/features/auth/SignUpForm.tsx
rm src/features/auth/SignInForm.tsx
rm src/features/auth/AccountLookupForm.tsx
```

- [ ] **Step 2: Verify full build passes**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no TypeScript or Vite errors.

- [ ] **Step 3: Run unit tests**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm test 2>&1
```

Expected: All tests pass (auth-related tests that referenced internalAuthStore may need to be deleted or updated).

- [ ] **Step 4: If any test files import deleted files, delete those test files**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
grep -r "internalAuthStore\|PasswordChangePanel\|AdminRecoveryManager\|SignUpForm\|SignInForm\|AccountLookupForm" src/ --include="*.test.*" -l
```

Delete any listed test files, then re-run `npm test`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add -A
git commit -m "feat: remove legacy local auth system"
```

---

## Task 12: Deploy Firestore Security Rules

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`

- [ ] **Step 1: Create firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow read, write: if request.auth != null;
    }
    match /roster/shared {
      allow read, write: if request.auth != null;
    }
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /settings/github {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

- [ ] **Step 2: Create firebase.json**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 3: Check Firebase CLI is available**

```bash
firebase --version 2>&1
```

Expected: version string like `13.x.x`. If not installed: `npm install -g firebase-tools`.

- [ ] **Step 4: Deploy security rules**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
firebase deploy --only firestore:rules --project ministry-report-v2
```

Expected: `Deploy complete!`

- [ ] **Step 5: Commit**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add firestore.rules firebase.json
git commit -m "feat: add and deploy Firestore security rules"
```

---

## Task 13: Add Firebase Config to GitHub Actions + Add Authorized Domain

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add authorized domain in Firebase Console**

In the Firebase Console → Authentication → Settings → Authorized domains:
Add `max2guy.github.io`

(This must be done manually in the browser.)

- [ ] **Step 2: Add GitHub Secrets**

In the GitHub repo → Settings → Secrets and variables → Actions, add these secrets:

```
VITE_FIREBASE_API_KEY=AIzaSyBMSjFAkSvT1ZXaOSvrcFkKC-j-eIgAyXo
VITE_FIREBASE_AUTH_DOMAIN=ministry-report-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ministry-report-v2
VITE_FIREBASE_STORAGE_BUCKET=ministry-report-v2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=336428867981
VITE_FIREBASE_APP_ID=1:336428867981:web:91a8c9766c14e7d738ddc4
```

- [ ] **Step 3: Update deploy.yml to pass env vars**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build
        env:
          NODE_ENV: production
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 4: Verify local build with env vars works**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 5: Commit and push**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add .github/workflows/deploy.yml
git commit -m "ci: pass Firebase env vars to GitHub Actions build"
git push origin main
```

Expected: GitHub Actions workflow starts, completes deploy.

- [ ] **Step 6: Verify deployed app**

Open `https://max2guy.github.io/ministry-report-v2/` in a browser, confirm:
1. Google Sign-in button appears
2. Clicking it opens a Google OAuth popup
3. After sign-in, the main app loads with reports from Firestore

---

## Self-Review

### Spec Coverage
- ✅ Firebase Auth Google Sign-in → Task 3, 4
- ✅ users/{uid} Firestore doc with role → Task 3
- ✅ First user = admin → Task 3 (getOrCreateUserDoc)
- ✅ Firestore reports CRUD → Task 5
- ✅ Firestore roster/shared → Task 6
- ✅ settings/github Gist ID storage → Task 7
- ✅ GitHub Gist backup (PAT in localStorage) → Task 7
- ✅ Admin-only GitHub settings panel → Task 9 (App.tsx conditional render)
- ✅ Migration dialog (IndexedDB → Firestore) → Task 9
- ✅ Offline persistence (enableIndexedDbPersistence) → Task 1
- ✅ Auth domain authorized → Task 13
- ✅ GitHub Actions env vars → Task 13
- ✅ Legacy files deleted → Task 11
- ✅ Firestore Security Rules → Task 12
- ✅ New auth UI (Google Sign-in only, no tabs) → Task 4

### Potential Issues
- `enableIndexedDbPersistence` is deprecated in Firebase 9.19+ in favor of `initializeFirestore` with `persistentLocalCache`. If deprecated warning appears, it still works — can be upgraded later.
- `onCreated` prop in AuthGate is now unused but kept for API compatibility. Task 4 handles this by aliasing it to `onSignedIn`.
