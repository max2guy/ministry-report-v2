# 계정 권한(RBAC) 기능 설계

**날짜:** 2026-05-15  
**버전 기준:** v2.4.41  
**방식:** 프론트엔드 전용 권한 제어 (Firestore 보안 규칙은 현행 유지)

---

## 1. 역할 체계

### 역할 정의

| 역할 | 식별자 | 결정 방식 |
|------|--------|----------|
| 최고관리자 | `superAdmin` | 런타임: `email === "max2guy@gmail.com"` (Firestore 저장 안 함) |
| 관리자 | `admin` | Firestore `users/{uid}.role` |
| 부서관리자 | `deptManager` | Firestore `users/{uid}.role` |
| 열람자 | `viewer` | Firestore `users/{uid}.role` (신규 가입 기본값) |

### 기존 `"reporter"` 처리
기존 Firestore 문서에 `role: "reporter"`가 저장된 계정은 마이그레이션 없이 코드에서 `"viewer"`로 취급한다. 데이터 변경 없음.

### Account 타입 변경

```ts
// 기존
type UserRole = "reporter" | "admin"

// 변경
type UserRole = "viewer" | "deptManager" | "admin"

type Account = {
  id: string
  email: string
  displayName: string
  role: UserRole
  departments?: DepartmentKey[]  // deptManager 전용. ["elementary", "adult"] 등 복수 가능
  createdAt: string
  updatedAt: string
}

// 런타임 헬퍼
function isSuperAdmin(account: Account): boolean {
  return account.email === "max2guy@gmail.com"
}
```

---

## 2. 권한 매핑

| 기능 | viewer | deptManager | admin | superAdmin |
|------|--------|-------------|-------|------------|
| 보고서 전체 조회 | ✅ | ✅ | ✅ | ✅ |
| 보고서 생성·삭제 | ❌ | ✅ | ✅ | ✅ |
| 보고서 편집 — 기본정보 탭 | ❌ | ✅ | ✅ | ✅ |
| 보고서 편집 — 부서 탭 | ❌ | ✅ 담당 부서만 | ✅ 전체 | ✅ |
| 보고서 편집 — 기도·광고 탭 | ❌ | ✅ | ✅ | ✅ |
| 명단 탭 접근 | ❌ | ✅ | ✅ | ✅ |
| 명단 편집 | ❌ | ✅ 담당 부서만 | ✅ 전체 | ✅ |
| 사용자 권한 관리 | ❌ | ❌ | ❌ | ✅ |

---

## 3. `usePermissions` 훅

**파일:** `src/auth/usePermissions.ts`

```ts
type Permissions = {
  canCreateReport: boolean
  canEditReport: boolean
  editableDepts: DepartmentKey[] | "all"   // 보고서 부서 탭 편집 가능 범위
  visibleDepts: DepartmentKey[] | "all"    // 보고서·명단에서 보이는 부서
  canAccessRoster: boolean                 // 명단 탭 접근 여부
  canManageUsers: boolean                  // 사용자 관리 패널 표시 여부
}

function usePermissions(account: Account | null): Permissions
```

**계산 규칙:**
- `account === null` → 모든 권한 false, `visibleDepts: "all"` (비로그인은 AuthGate에서 차단)
- `isSuperAdmin(account)` 또는 `role === "admin"` → 모든 권한 true, `visibleDepts: "all"`
- `role === "deptManager"` → `editableDepts = account.departments ?? []`, `visibleDepts = account.departments ?? []`
- `role === "viewer"` (또는 `"reporter"`) → `canCreateReport: false`, `canEditReport: false`, `canAccessRoster: false`

---

## 4. 사용자 관리 UI

**파일:** `src/features/auth/UserManagementPanel.tsx`  
**위치:** 설정(계정) 탭 하단, `superAdmin` 로그인 시에만 표시

### 화면 구성

```
사용자 관리
──────────────────────────────────
김우정   max2guy@gmail.com
최고관리자

──────────────────────────────────
홍길동   hong@gmail.com
[관리자 ▼]

──────────────────────────────────
이영희   lee@gmail.com
[부서관리자 ▼]  □유초등부 □중고등부 □청년부 □교구

──────────────────────────────────
박철수   park@gmail.com
[열람자 ▼]
──────────────────────────────────
```

### 인터랙션 규칙
- 역할 드롭다운 변경 → 즉시 Firestore `users/{uid}` 업데이트 (낙관적 UI)
- `deptManager` 선택 시 부서 체크박스 추가 표시, 복수 선택 가능
- 부서 체크박스 변경 → 즉시 Firestore 업데이트
- 자신의 계정(`max2guy@gmail.com`)은 변경 불가 (표시만)
- 로딩 중 스피너, 실패 시 에러 토스트

### Firestore 함수 추가

```ts
// src/auth/firebaseAuthStore.ts 추가
async function listAllUsers(): Promise<Account[]>
async function updateUserRole(uid: string, role: UserRole, departments?: DepartmentKey[]): Promise<void>
```

---

## 5. 앱 내 권한 게이트 적용

### `src/App.tsx`
- `usePermissions(currentAccount)` 호출 후 결과를 하위 컴포넌트에 props로 전달
- viewer일 때 편집 모드(`mode === "edit"`) 진입 시 뷰어 모드로 강제 전환

### `src/features/report/TabbedReportForm.tsx`
- `editableDepts` prop 추가
- `DEPT_TABS` 렌더링 시 `editableDepts === "all"` 또는 포함된 부서만 표시
- viewer 접근 시 편집 불가 안내 메시지

### `src/features/roster/MemberRosterTab.tsx`
- `visibleDepts` prop 추가
- 각 부서 섹션 렌더링 시 `visibleDepts`에 포함된 경우만 표시

### `src/features/nav/BottomTabBar.tsx`
- `canAccessRoster` prop 추가
- false일 때 명단 탭 숨김 (또는 비활성화 표시)

### `src/features/report/MobileReportList.tsx`
- `canCreateReport` prop 추가
- false일 때 "새 보고서 만들기" 버튼 숨김

---

## 6. 수정 파일 목록

| 파일 | 신규/수정 | 내용 |
|------|----------|------|
| `src/auth/authTypes.ts` | 수정 | `UserRole` 확장, `departments` 필드, `isSuperAdmin()` |
| `src/auth/firebaseAuthStore.ts` | 수정 | `listAllUsers()`, `updateUserRole()`, 기본값 `"viewer"` |
| `src/auth/usePermissions.ts` | **신규** | 권한 계산 훅 |
| `src/features/auth/UserManagementPanel.tsx` | **신규** | 사용자 관리 UI 컴포넌트 |
| `src/features/auth/ReporterAccountPanel.tsx` | 수정 | `UserManagementPanel` 통합 |
| `src/features/report/TabbedReportForm.tsx` | 수정 | `editableDepts` 기반 탭 필터링 |
| `src/features/roster/MemberRosterTab.tsx` | 수정 | `visibleDepts` 기반 부서 필터링 |
| `src/features/nav/BottomTabBar.tsx` | 수정 | `canAccessRoster` 기반 명단 탭 제어 |
| `src/features/report/MobileReportList.tsx` | 수정 | `canCreateReport` 기반 버튼 제어 |
| `src/App.tsx` | 수정 | `usePermissions` 연결 및 props 전달 |
| `src/styles.css` | 수정 | 사용자 관리 패널 스타일 추가 |

---

## 7. 제외 범위

- Firestore 보안 규칙 변경 없음 (프론트엔드 전용)
- Cloud Functions 없음
- 역할별 알림/이메일 없음
- 감사 로그(audit log) 없음
