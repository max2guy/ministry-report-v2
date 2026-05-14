# Role-Based Access Control (RBAC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 계정 권한 시스템 추가 — 최고관리자(max2guy@gmail.com)가 사용자에게 관리자/부서관리자/열람자 역할을 부여하고, 부서관리자는 담당 부서만 접근·편집 가능하도록 앱 전체에 권한 게이트 적용

**Architecture:** 프론트엔드 전용 권한 제어. Firestore `users/{uid}` 문서에 `role`과 `departments` 필드를 저장하고, `usePermissions()` 훅이 현재 계정 기반으로 권한 객체를 계산한다. 컴포넌트들은 권한 객체를 prop으로 받아 UI를 조건부 렌더링한다.

**Tech Stack:** React 19, TypeScript, Firebase Firestore (`updateDoc`, `getDocs`), 기존 CSS 변수 시스템

---

## 파일 구조

| 파일 | 신규/수정 | 역할 |
|------|----------|------|
| `src/auth/authTypes.ts` | 수정 | UserRole 확장, departments 필드, isSuperAdmin() |
| `src/auth/firebaseAuthStore.ts` | 수정 | listAllUsers(), updateUserRole(), 기본값 viewer |
| `src/auth/usePermissions.ts` | **신규** | 권한 계산 훅 |
| `src/features/auth/UserManagementPanel.tsx` | **신규** | 사용자 관리 UI |
| `src/features/auth/ReporterAccountPanel.tsx` | 수정 | UserManagementPanel 통합 |
| `src/features/report/TabbedReportForm.tsx` | 수정 | editableDepts prop으로 탭 필터링 |
| `src/features/roster/MemberRosterTab.tsx` | 수정 | visibleDepts prop으로 부서 필터링 |
| `src/features/nav/BottomTabBar.tsx` | 수정 | canAccessRoster prop으로 명단 탭 제어 |
| `src/features/report/MobileReportList.tsx` | 수정 | canCreateReport prop으로 버튼 제어 |
| `src/App.tsx` | 수정 | usePermissions 연결, 권한 props 전달 |
| `src/styles.css` | 수정 | 사용자 관리 패널 스타일 |

---

## Task 1: authTypes.ts — 역할 타입 확장

**Files:**
- Modify: `src/auth/authTypes.ts`

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

```ts
import type { DepartmentKey } from "../domain/reportTypes";

export type UserRole = "viewer" | "deptManager" | "admin";
// "reporter"는 레거시값 — 코드에서 "viewer"로 취급, Firestore 마이그레이션 없음

export type Account = {
  id: string;          // Firebase uid
  email: string;
  displayName: string;
  role: UserRole;
  departments?: DepartmentKey[];  // deptManager 전용: 담당 부서 키 배열
  createdAt: string;
  updatedAt: string;
};

/** max2guy@gmail.com 여부를 런타임에 결정 — Firestore에 저장하지 않음 */
export function isSuperAdmin(account: Account | null | undefined): boolean {
  return account?.email === "max2guy@gmail.com";
}
```

- [ ] **Step 2: 빌드 오류 확인**

```bash
cd /path/to/ministry-report-v2
npm run build 2>&1 | grep -E "error TS|Error"
```

TypeScript가 `DepartmentKey` 순환 참조 오류를 낼 수 있다. 만약 오류가 나면 `authTypes.ts`에서 `DepartmentKey` import 대신 인라인 타입을 쓴다:

```ts
// import 제거 후 인라인 정의
export type AccountDepartmentKey = "elementary" | "middleHigh" | "youngAdult" | "adult";

export type Account = {
  ...
  departments?: AccountDepartmentKey[];
};
```

그리고 `usePermissions.ts`에서 `DepartmentKey`를 직접 사용하여 `AccountDepartmentKey`와 맞춘다.

- [ ] **Step 3: 커밋**

```bash
git add src/auth/authTypes.ts
git commit -m "feat(rbac): extend UserRole type and add isSuperAdmin helper"
```

---

## Task 2: firebaseAuthStore.ts — 사용자 목록 조회·역할 변경 함수 추가

**Files:**
- Modify: `src/auth/firebaseAuthStore.ts`

- [ ] **Step 1: import 줄에 `orderBy`, `query` 추가**

현재 import:
```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
```

변경 후:
```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
```

- [ ] **Step 2: `getOrCreateUserDoc` 내부 수정 — 기본 role을 "viewer"로, 기존 "reporter" 처리**

기존 코드 (22~61줄) 전체를 아래로 교체:

```ts
/** Firestore users/{uid} 문서를 읽거나 없으면 생성 */
export async function getOrCreateUserDoc(user: User): Promise<Account> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    const rawRole = data.role as string;
    // 레거시 "reporter" → "viewer" 취급 (Firestore 값 변경 없음)
    const role: UserRole =
      rawRole === "reporter" || rawRole === "viewer"
        ? "viewer"
        : rawRole === "admin"
          ? "admin"
          : rawRole === "deptManager"
            ? "deptManager"
            : "viewer";
    return {
      id: user.uid,
      email: user.email ?? "",
      displayName: (data.displayName as string) || user.displayName || "",
      role,
      departments: (data.departments as DepartmentKey[]) ?? undefined,
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string,
    };
  }

  // 첫 사용자인지 확인 (users 컬렉션이 비어있으면 admin)
  const allUsers = await getDocs(collection(db, "users"));
  const role: UserRole = allUsers.empty ? "admin" : "viewer";

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
```

- [ ] **Step 3: 파일 끝에 `listAllUsers`와 `updateUserRole` 함수 추가**

```ts
/** 모든 사용자 문서 조회 (최고관리자 전용) */
export async function listAllUsers(): Promise<Account[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    const rawRole = data.role as string;
    const role: UserRole =
      rawRole === "admin" ? "admin"
      : rawRole === "deptManager" ? "deptManager"
      : "viewer";
    return {
      id: d.id,
      email: (data.email as string) ?? "",
      displayName: (data.displayName as string) ?? "",
      role,
      departments: (data.departments as DepartmentKey[]) ?? undefined,
      createdAt: (data.createdAt as string) ?? "",
      updatedAt: (data.updatedAt as string) ?? "",
    };
  });
}

/** 사용자 역할 변경 (최고관리자 전용) */
export async function updateUserRole(
  uid: string,
  role: UserRole,
  departments?: DepartmentKey[],
): Promise<void> {
  const ref = doc(db, "users", uid);
  const now = new Date().toISOString();
  if (role === "deptManager") {
    await updateDoc(ref, { role, departments: departments ?? [], updatedAt: now });
  } else {
    await updateDoc(ref, { role, departments: deleteField(), updatedAt: now });
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

오류 없으면 진행.

- [ ] **Step 5: 커밋**

```bash
git add src/auth/firebaseAuthStore.ts
git commit -m "feat(rbac): add listAllUsers, updateUserRole, default role viewer"
```

---

## Task 3: usePermissions.ts — 권한 계산 훅 (신규)

**Files:**
- Create: `src/auth/usePermissions.ts`

- [ ] **Step 1: 파일 생성**

```ts
import type { DepartmentKey } from "../domain/reportTypes";
import type { Account } from "./authTypes";
import { isSuperAdmin } from "./authTypes";

export type Permissions = {
  canCreateReport: boolean;
  canEditReport: boolean;
  /** 보고서 탭에서 편집 가능한 부서. "all"이면 전체. */
  editableDepts: DepartmentKey[] | "all";
  /** 보고서 탭·명단 탭에서 보이는 부서. "all"이면 전체. */
  visibleDepts: DepartmentKey[] | "all";
  canAccessRoster: boolean;
  canManageUsers: boolean;
};

const DENY_ALL: Permissions = {
  canCreateReport: false,
  canEditReport: false,
  editableDepts: "all",
  visibleDepts: "all",
  canAccessRoster: false,
  canManageUsers: false,
};

const ALLOW_ALL: Permissions = {
  canCreateReport: true,
  canEditReport: true,
  editableDepts: "all",
  visibleDepts: "all",
  canAccessRoster: true,
  canManageUsers: false,
};

export function usePermissions(account: Account | null | undefined): Permissions {
  if (!account) return DENY_ALL;

  if (isSuperAdmin(account)) {
    return { ...ALLOW_ALL, canManageUsers: true };
  }

  if (account.role === "admin") {
    return ALLOW_ALL;
  }

  if (account.role === "deptManager") {
    const depts = account.departments ?? [];
    return {
      canCreateReport: true,
      canEditReport: true,
      editableDepts: depts,
      visibleDepts: depts,
      canAccessRoster: true,
      canManageUsers: false,
    };
  }

  // viewer (기본값, 레거시 "reporter" 포함)
  return {
    canCreateReport: false,
    canEditReport: false,
    editableDepts: "all",
    visibleDepts: "all",
    canAccessRoster: false,
    canManageUsers: false,
  };
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 3: 커밋**

```bash
git add src/auth/usePermissions.ts
git commit -m "feat(rbac): add usePermissions hook"
```

---

## Task 4: UserManagementPanel.tsx — 사용자 관리 UI (신규)

**Files:**
- Create: `src/features/auth/UserManagementPanel.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
import { useEffect, useState } from "react";
import type { Account, UserRole } from "../../auth/authTypes";
import { isSuperAdmin } from "../../auth/authTypes";
import { listAllUsers, updateUserRole } from "../../auth/firebaseAuthStore";
import type { DepartmentKey } from "../../domain/reportTypes";

const DEPT_OPTIONS: { key: DepartmentKey; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "viewer", label: "열람자" },
  { value: "deptManager", label: "부서관리자" },
  { value: "admin", label: "관리자" },
];

type Props = {
  currentAccount: Account;
};

export function UserManagementPanel({ currentAccount }: Props) {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAllUsers()
      .then((list) => {
        // 최고관리자를 맨 위로, 나머지는 이름순
        list.sort((a, b) => {
          if (isSuperAdmin(a)) return -1;
          if (isSuperAdmin(b)) return 1;
          return a.displayName.localeCompare(b.displayName, "ko");
        });
        setUsers(list);
      })
      .catch(() => setError("사용자 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(user: Account, role: UserRole) {
    const prevUsers = users;
    const depts = role === "deptManager" ? (user.departments ?? []) : undefined;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role, departments: depts } : u)),
    );
    try {
      await updateUserRole(user.id, role, depts);
      setError(null);
    } catch {
      setError("권한 변경에 실패했습니다.");
      setUsers(prevUsers);
    }
  }

  async function handleDeptToggle(user: Account, dept: DepartmentKey) {
    const prevUsers = users;
    const current = user.departments ?? [];
    const next = current.includes(dept)
      ? current.filter((d) => d !== dept)
      : [...current, dept];
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, departments: next } : u)),
    );
    try {
      await updateUserRole(user.id, "deptManager", next);
      setError(null);
    } catch {
      setError("부서 변경에 실패했습니다.");
      setUsers(prevUsers);
    }
  }

  return (
    <section className="user-mgmt-panel">
      <h3 className="user-mgmt-title">사용자 관리</h3>
      {loading && <p className="user-mgmt-loading">불러오는 중…</p>}
      {error && <p className="user-mgmt-error">{error}</p>}
      <ul className="user-mgmt-list">
        {users.map((user) => {
          const isSelf = user.id === currentAccount.id;
          const isSuper = isSuperAdmin(user);
          return (
            <li key={user.id} className="user-mgmt-item">
              <div className="user-mgmt-info">
                <span className="user-mgmt-name">
                  {user.displayName || "이름 없음"}
                </span>
                <span className="user-mgmt-email">{user.email}</span>
              </div>
              {isSuper || isSelf ? (
                <span className="user-mgmt-role-badge">
                  {isSuper ? "최고관리자" : "내 계정"}
                </span>
              ) : (
                <div className="user-mgmt-controls">
                  <select
                    className="user-mgmt-role-select"
                    value={user.role}
                    aria-label={`${user.displayName} 역할`}
                    onChange={(e) =>
                      void handleRoleChange(user, e.currentTarget.value as UserRole)
                    }
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {user.role === "deptManager" && (
                    <div className="user-mgmt-depts">
                      {DEPT_OPTIONS.map(({ key, label }) => (
                        <label key={key} className="user-mgmt-dept-check">
                          <input
                            type="checkbox"
                            checked={(user.departments ?? []).includes(key)}
                            onChange={() => void handleDeptToggle(user, key)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/auth/UserManagementPanel.tsx
git commit -m "feat(rbac): add UserManagementPanel component"
```

---

## Task 5: ReporterAccountPanel.tsx — UserManagementPanel 통합

**Files:**
- Modify: `src/features/auth/ReporterAccountPanel.tsx`

- [ ] **Step 1: import 추가 및 props 타입 수정**

파일 상단 import 블록에 추가:
```ts
import { isSuperAdmin } from "../../auth/authTypes";
import { UserManagementPanel } from "./UserManagementPanel";
```

- [ ] **Step 2: JSX return 끝부분에 UserManagementPanel 추가**

현재 return 마지막 `</section>` 직전:

```tsx
      {/* 최고관리자에게만 사용자 관리 패널 표시 */}
      {isSuperAdmin(currentAccount) && (
        <UserManagementPanel currentAccount={currentAccount} />
      )}
    </section>
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/auth/ReporterAccountPanel.tsx
git commit -m "feat(rbac): show UserManagementPanel for superAdmin in account panel"
```

---

## Task 6: TabbedReportForm.tsx — editableDepts prop으로 탭 필터링

**Files:**
- Modify: `src/features/report/TabbedReportForm.tsx`

- [ ] **Step 1: Props 타입에 `editableDepts` 추가**

기존:
```ts
type Props = {
  report: MinistryReport;
  reports: MinistryReport[];
  onChange: (report: MinistryReport) => void;
};
```

변경:
```ts
import type { DepartmentKey } from "../../domain/reportTypes";

type Props = {
  report: MinistryReport;
  reports: MinistryReport[];
  onChange: (report: MinistryReport) => void;
  editableDepts: DepartmentKey[] | "all";
};
```

- [ ] **Step 2: 함수 시그니처와 탭 필터링 로직 추가**

`export function TabbedReportForm({ report, reports, onChange }` →
```ts
export function TabbedReportForm({ report, reports, onChange, editableDepts }: Props) {
```

`const currentYear = ...` 바로 아래에 추가:
```ts
  // 부서 탭 필터링: info·prayer는 항상 표시, 부서 탭은 editableDepts 기준
  const visibleTabs = TABS.filter((tab) => {
    if (tab.key === "info" || tab.key === "prayer") return true;
    if (editableDepts === "all") return true;
    return editableDepts.includes(tab.key as DepartmentKey);
  });
```

- [ ] **Step 3: TABS → visibleTabs로 교체**

탭 바 렌더링:
```tsx
{visibleTabs.map((tab) => (
```

스와이프 핸들러 내부 keys 참조:
```ts
const keys = visibleTabs.map((t) => t.key);
```

- [ ] **Step 4: DEPT_TABS 필터링도 적용**

기존 `{DEPT_TABS.map(({ key }) => {` →
```tsx
{DEPT_TABS.filter(({ key }) =>
  editableDepts === "all" || editableDepts.includes(key)
).map(({ key }) => {
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 6: 커밋**

```bash
git add src/features/report/TabbedReportForm.tsx
git commit -m "feat(rbac): filter report tabs by editableDepts prop"
```

---

## Task 7: MemberRosterTab.tsx — visibleDepts prop으로 부서 필터링

**Files:**
- Modify: `src/features/roster/MemberRosterTab.tsx`

- [ ] **Step 1: Props 타입에 `visibleDepts` 추가**

```ts
type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
  visibleDepts: DepartmentKey[] | "all";
};
```

- [ ] **Step 2: 함수 시그니처 변경 및 탭 필터링**

```ts
export function MemberRosterTab({ roster, onChange, visibleDepts }: Props) {
  const filteredTabs = DEPT_TABS.filter(({ key }) =>
    visibleDepts === "all" || visibleDepts.includes(key),
  );

  const [activeDept, setActiveDept] = useState<DepartmentKey>(
    filteredTabs[0]?.key ?? "elementary",
  );
```

- [ ] **Step 3: DEPT_TABS → filteredTabs로 교체**

탭 버튼 렌더링:
```tsx
{filteredTabs.map(({ key, label }) => (
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 5: 커밋**

```bash
git add src/features/roster/MemberRosterTab.tsx
git commit -m "feat(rbac): filter roster dept tabs by visibleDepts prop"
```

---

## Task 8: BottomTabBar.tsx — canAccessRoster prop으로 명단 탭 제어

**Files:**
- Modify: `src/features/nav/BottomTabBar.tsx`

- [ ] **Step 1: Props 타입에 `canAccessRoster` 추가**

```ts
type BottomTabBarProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  canAccessRoster: boolean;
};
```

- [ ] **Step 2: 함수 시그니처 변경 및 탭 필터링**

```ts
export function BottomTabBar({ activeTab, onTabChange, canAccessRoster }: BottomTabBarProps) {
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "roster") return canAccessRoster;
    return true;
  });

  return (
    <nav className="bottom-tab-bar" aria-label="하단 탭 메뉴">
      {visibleTabs.map((tab) => (
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/nav/BottomTabBar.tsx
git commit -m "feat(rbac): hide roster tab when canAccessRoster is false"
```

---

## Task 9: MobileReportList.tsx — canCreateReport prop으로 새 보고서 버튼 제어

**Files:**
- Modify: `src/features/report/MobileReportList.tsx`

- [ ] **Step 1: Props 타입에 `canCreateReport` 추가**

```ts
type MobileReportListProps = {
  reports: MinistryReport[];
  appMode: AppMode;
  onSelectReport: (report: MinistryReport) => void;
  onNewReport: () => void;
  canCreateReport: boolean;
};
```

- [ ] **Step 2: 함수 시그니처 변경 및 버튼 조건 수정**

```ts
export function MobileReportList({
  reports,
  appMode,
  onSelectReport,
  onNewReport,
  canCreateReport,
}: MobileReportListProps) {
```

기존 `{appMode === "reporter" && (` 조건을:
```tsx
{canCreateReport && (
```

으로 교체.

기존 리스트 섹션 레이블:
```tsx
<p className="mobile-report-section-label">
  {canCreateReport ? "저장된 보고서 — 탭하여 수정" : "이전 보고서"}
</p>
```

카드의 배지도 동일하게:
```tsx
{canCreateReport ? (
  <span className="mobile-report-card-edit-badge" aria-hidden="true">수정</span>
) : (
  <span className="mobile-report-card-chevron" aria-hidden="true">›</span>
)}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/report/MobileReportList.tsx
git commit -m "feat(rbac): hide new report button when canCreateReport is false"
```

---

## Task 10: App.tsx — usePermissions 연결 및 props 전달

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 추가:
```ts
import { usePermissions } from "./auth/usePermissions";
import { isSuperAdmin } from "./auth/authTypes";
```

- [ ] **Step 2: usePermissions 훅 호출**

`const { isInstallable, promptInstall } = useInstallPrompt();` 근처에 추가:
```ts
const permissions = usePermissions(currentAccount);
```

- [ ] **Step 3: viewer가 edit 모드 진입 시 차단**

`handleLoadReport` 또는 `handleNewReport` 함수 내부, 혹은 `useEffect`로 모드 감시:

`mode` state를 set하는 곳 또는 mode 초기화 근처에 아래 effect 추가:
```ts
useEffect(() => {
  if (mode === "edit" && !permissions.canEditReport && currentAccount) {
    setMode("viewer");
  }
}, [mode, permissions.canEditReport, currentAccount]);
```

- [ ] **Step 4: BottomTabBar에 canAccessRoster prop 전달**

기존:
```tsx
<BottomTabBar
  activeTab={mobileTab}
  onTabChange={(tab) => { ... }}
/>
```

변경:
```tsx
<BottomTabBar
  activeTab={mobileTab}
  canAccessRoster={permissions.canAccessRoster}
  onTabChange={(tab) => { ... }}
/>
```

- [ ] **Step 5: MobileReportList에 canCreateReport prop 전달**

기존:
```tsx
<MobileReportList
  reports={reports}
  appMode={appMode}
  onSelectReport={...}
  onNewReport={handleNewReport}
/>
```

변경:
```tsx
<MobileReportList
  reports={reports}
  appMode={appMode}
  onSelectReport={...}
  onNewReport={handleNewReport}
  canCreateReport={permissions.canCreateReport}
/>
```

- [ ] **Step 6: MemberRosterTab에 visibleDepts prop 전달**

기존:
```tsx
<MemberRosterTab roster={roster} onChange={handleRosterChange} />
```

변경:
```tsx
<MemberRosterTab
  roster={roster}
  onChange={handleRosterChange}
  visibleDepts={permissions.visibleDepts}
/>
```

- [ ] **Step 7: TabbedReportForm에 editableDepts prop 전달**

App.tsx 내에서 `<TabbedReportForm`이 사용되는 모든 곳에 prop 추가:
```tsx
<TabbedReportForm
  report={report}
  reports={reports}
  onChange={handleReportChange}
  editableDepts={permissions.editableDepts}
/>
```

- [ ] **Step 8: GithubSettingsPanel 표시 조건 업데이트**

기존:
```tsx
{currentAccount?.role === "admin" && <GithubSettingsPanel />}
```

변경:
```tsx
{(currentAccount?.role === "admin" || isSuperAdmin(currentAccount)) && <GithubSettingsPanel />}
```

(모바일 계정 탭 안에도 같은 조건이 있으면 동일하게 수정)

- [ ] **Step 9: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```

오류 없으면 진행.

- [ ] **Step 10: 커밋**

```bash
git add src/App.tsx
git commit -m "feat(rbac): wire usePermissions to App.tsx and pass permission props"
```

---

## Task 11: styles.css — 사용자 관리 패널 스타일

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 파일 끝에 스타일 추가**

```css
/* ── UserManagementPanel ── */
.user-mgmt-panel {
  margin-top: 16px;
  border-top: 1px solid var(--clr-border);
  padding-top: 16px;
}

.user-mgmt-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--clr-text-secondary);
  margin: 0 0 12px;
}

.user-mgmt-loading,
.user-mgmt-error {
  font-size: 13px;
  padding: 6px 0;
}

.user-mgmt-error {
  color: #dc2626;
}

.user-mgmt-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.user-mgmt-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--clr-border-soft);
}

.user-mgmt-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-mgmt-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--clr-text-primary, var(--clr-text-secondary));
}

.user-mgmt-email {
  font-size: 12px;
  color: var(--clr-text-muted);
}

.user-mgmt-role-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--clr-primary);
  background: var(--clr-present-bg);
  border: 1px solid var(--clr-primary-light);
  border-radius: 20px;
  padding: 2px 10px;
  align-self: flex-start;
}

.user-mgmt-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-mgmt-role-select {
  font-size: 13px;
  font-weight: 500;
  padding: 5px 8px;
  border: 1px solid var(--clr-border);
  border-radius: 6px;
  background: var(--clr-card-bg);
  color: var(--clr-text-secondary);
  width: 100%;
}

.user-mgmt-depts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.user-mgmt-dept-check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--clr-text-secondary);
  cursor: pointer;
}

.user-mgmt-dept-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--clr-primary);
  cursor: pointer;
}
```

- [ ] **Step 2: 최종 빌드 확인**

```bash
npm run build 2>&1
```

경고만 있고 오류 없으면 성공.

- [ ] **Step 3: 전체 커밋 및 push**

```bash
git add src/styles.css package.json
# package.json version 을 2.5.0으로 올린다
git commit -m "feat(rbac): complete role-based access control (v2.5.0)"
git push origin main
```

---

## 자체 검토 결과

**스펙 커버리지:**
- ✅ viewer 기본 역할 (Task 2)
- ✅ deptManager 부서 격리 — 보고서 탭 (Task 6), 명단 탭 (Task 7)
- ✅ 명단 탭 접근 차단 viewer (Task 8)
- ✅ 새 보고서 버튼 차단 viewer (Task 9)
- ✅ isSuperAdmin() 런타임 결정 (Task 1)
- ✅ 사용자 관리 UI — 역할 변경, 부서 선택 (Task 4)
- ✅ superAdmin만 관리 패널 표시 (Task 5)
- ✅ 레거시 "reporter" → "viewer" 처리 (Task 2)

**타입 일관성:**
- `DepartmentKey[] | "all"` — Task 3, 6, 7, 10 모두 동일 시그니처 사용
- `Permissions` 타입은 Task 3에서 정의, Task 10에서 소비
- `isSuperAdmin(account)` — Task 1에서 정의, Task 4·5·10에서 사용
