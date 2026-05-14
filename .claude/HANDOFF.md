# ministry-report-v2 — Codex Handoff (v2.5.0)

## 현재 상태
- 커밋: `eb0c44f` — feat(rbac): merge role-based access control (v2.5.0)
- 브랜치: `main`
- 배포: GitHub Pages (main push → Actions 자동 배포)

---

## 이번 세션에서 수정한 내용 (v2.5.0 — RBAC)

### RBAC (Role-Based Access Control) 구현
프론트엔드 전용 권한 제어 시스템 추가.

**역할 체계:**
- `superAdmin` — 런타임: `email === "max2guy@gmail.com"` (Firestore 미저장)
- `admin` — Firestore `users/{uid}.role = "admin"`
- `deptManager` — Firestore `users/{uid}.role = "deptManager"` + `departments[]`
- `viewer` — Firestore `users/{uid}.role = "viewer"` (기본값, 레거시 "reporter" 포함)

**수정 파일:**
- `src/auth/authTypes.ts`: UserRole 확장 (`viewer|deptManager|admin`), `departments?`, `isSuperAdmin()`
- `src/auth/firebaseAuthStore.ts`: `listAllUsers()`, `updateUserRole()`, 기본값 viewer, reporter→viewer 정규화
- `src/auth/usePermissions.ts` (신규): 권한 계산 훅 — `Permissions` 타입, 역할별 권한 반환
- `src/features/auth/UserManagementPanel.tsx` (신규): 사용자 목록, 역할 드롭다운, 부서 체크박스
- `src/features/auth/ReporterAccountPanel.tsx`: superAdmin일 때 UserManagementPanel 표시
- `src/features/report/TabbedReportForm.tsx`: `editableDepts` prop으로 부서 탭 필터링
- `src/features/report/ReportEditor.tsx`: `editableDepts` prop 추가 및 전달
- `src/features/roster/MemberRosterTab.tsx`: `visibleDepts` prop으로 부서 탭 필터링
- `src/features/nav/BottomTabBar.tsx`: `canAccessRoster` prop으로 명단 탭 제어
- `src/features/report/MobileReportList.tsx`: `canCreateReport` prop으로 새 보고서 버튼 제어
- `src/App.tsx`: `usePermissions()` 연결, 모든 permission props 전달, viewer→view 모드 강제
- `src/styles.css`: `.user-mgmt-*` 클래스 추가

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19 + TypeScript + Vite 6 |
| PWA | vite-plugin-pwa (Service Worker, 오프라인 지원) |
| 스타일 | 단일 파일 `src/styles.css`, CSS 변수 기반 테마 |
| 인증 | Firebase Auth (Google 로그인) |
| DB | Firestore (persistentLocalCache + try/catch fallback) |
| 배포 | GitHub Pages (`.github/workflows/deploy.yml`) |

### 빌드 & 개발
```bash
npm run dev         # 개발 서버 http://localhost:5173
npm run build       # tsc --noEmit && vite build → dist/
npm test            # vitest (unit)
npm run smoke       # playwright e2e (빌드 선행 필요)
npm run verify      # npm test && npm run smoke
```

---

## 주요 파일 구조

```
src/
├── App.tsx                          # 루트: 상태·라우팅·usePermissions 연결
├── auth/
│   ├── authTypes.ts                 # UserRole, Account, isSuperAdmin()
│   ├── firebaseAuthStore.ts         # Google 로그인, listAllUsers, updateUserRole
│   └── usePermissions.ts            # Permissions 훅 (역할 → 권한 계산)
├── features/
│   ├── auth/
│   │   ├── AuthGate.tsx             # 로그인 화면
│   │   ├── ReporterAccountPanel.tsx # 계정 설정 패널 (superAdmin: UserManagementPanel 포함)
│   │   └── UserManagementPanel.tsx  # 사용자 역할·부서 관리 UI (superAdmin 전용)
│   ├── report/
│   │   ├── TabbedReportForm.tsx     # 보고서 폼 (editableDepts 기반 탭 필터링)
│   │   ├── ReportEditor.tsx         # 보고서 편집기 래퍼
│   │   └── MobileReportList.tsx     # 보고서 목록 (canCreateReport 기반 버튼 제어)
│   ├── roster/
│   │   └── MemberRosterTab.tsx      # 명단 탭 (visibleDepts 기반 부서 필터링)
│   └── nav/
│       └── BottomTabBar.tsx         # 하단 탭바 (canAccessRoster 기반 명단 탭 제어)
└── styles.css                       # 전체 스타일 (~3760줄)
```

---

## 알려진 이슈 / 후속 작업 후보
- Firestore 보안 규칙 강화 (현재 프론트엔드 전용 권한 제어)
- viewer가 roster 탭에 접근 시 강제로 report 탭으로 이동시키는 UX
- 구역 이동 후 목적지 구역으로 자동 스크롤
- 보고서 이미지/PDF 내보내기
