# ministry-report-v2 — Codex Handoff (v2.5.1)

## 현재 상태
- 브랜치: `main`
- 최신 커밋: `82c4112` — "feat(ui): apply mobile layout to touch devices via pointer: coarse (v2.5.1)"
- origin/main과 동기화 완료

## 방금 수정한 내용

### v2.5.1 — iPad 모바일 레이아웃 (pointer: coarse)
- **문제:** 아이패드 가로(1024px+) 및 iPad Pro 세로(834px)는 820px 초과로 데스크탑 UI가 표시됨
- **해결:** `src/styles.css`의 모든 `@media (max-width: 820px)` (10곳)를 `@media (max-width: 820px), (pointer: coarse)`로 교체
- 터치 기기(아이폰, 아이패드)는 화면 너비 무관하게 모바일 UI 표시
- JS 변경 없음. `@media (max-width: 500px)`, `@media (max-width: 380px)` 소형 폰 쿼리는 그대로 유지

### v2.5.0 — RBAC (Role-Based Access Control)
- `UserRole = "viewer" | "deptManager" | "admin"` 추가 (`src/auth/authTypes.ts`)
- `isSuperAdmin(account)` — `max2guy@gmail.com` 전용 최고 권한
- `usePermissions()` 훅 — 역할 기반 권한 계산 (`src/auth/usePermissions.ts`)
- `UserManagementPanel` — 슈퍼어드민 전용 유저 역할/부서 관리 UI (`src/features/auth/UserManagementPanel.tsx`)
- `listAllUsers()`, `updateUserRole()` Firestore 함수 추가 (`src/auth/firebaseAuthStore.ts`)
- App.tsx에서 `usePermissions()` 결과를 각 컴포넌트에 주입

## 프로젝트 개요
- **프레임워크:** React 19 + TypeScript + Vite PWA
- **스타일:** CSS Modules / 전역 `src/styles.css`
- **인증/DB:** Firebase Auth + Firestore
- **빌드:** `npm run build`
- **테스트:** `npm test` (Vitest, 31개 통과)
- **배포:** Firebase Hosting (`firebase deploy`)

## 주요 파일
| 파일 | 역할 |
|------|------|
| `src/App.tsx` | 최상위 컴포넌트, 권한 주입 |
| `src/auth/authTypes.ts` | Account, UserRole, isSuperAdmin 타입 |
| `src/auth/usePermissions.ts` | 권한 계산 훅 |
| `src/auth/firebaseAuthStore.ts` | Firestore 유저 CRUD |
| `src/features/auth/UserManagementPanel.tsx` | 유저 관리 UI |
| `src/features/report/TabbedReportForm.tsx` | 부서별 탭 보고서 폼 |
| `src/features/roster/MemberRosterTab.tsx` | 대원 명부 탭 |
| `src/features/nav/BottomTabBar.tsx` | 하단 내비게이션 |
| `src/styles.css` | 전역 스타일 + 모바일 미디어쿼리 |

## 다음으로 할 수 있는 작업
- Firestore Security Rules에 RBAC 반영 (현재 프론트엔드 전용)
- 아이패드 전용 레이아웃 세부 최적화 (필요 시)
- 푸시 알림(FCM) 개선
- 오프라인 지원 강화 (Service Worker 캐시 전략)

## 빌드 & 배포
```bash
npm run build        # Vite 빌드
npm test             # 테스트 (31개)
firebase deploy      # Firebase Hosting 배포
```
