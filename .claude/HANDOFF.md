# ministry-report-v2 — Codex Handoff (v2.5.3)

## 현재 상태
- 최신 커밋: `e99dbda chore: bump version to 2.5.3`
- 브랜치: `main` (origin/main 동기화 완료)
- 버전: 2.5.3

## 방금 수정한 내용

### v2.5.3 — 데스크탑 UI 3단 레이아웃 재구성

**문제**: 데스크탑 레이아웃이 헤더 + 200px 사이드바 구조로 공간 낭비 및 역할 혼재.

**해결**: CSS Grid 3단 레이아웃으로 전면 재구성.

#### 변경 파일
- **`src/features/nav/DesktopSidebar.tsx`** (신규): 좌측 220px 사이드바 — 앱 타이틀/버전, 계정(아바타+이름+이메일+로그아웃), 네비게이션(보고서/뷰어/명단/설정), 액션 버튼(새 보고서/저장/내보내기, 편집 모드만), 하단 유틸(ThemeSelector, 강제새로고침, PWA 설치)
- **`src/features/report/DesktopBottomPanel.tsx`** (신규): 하단 고정 220px 패널 — 좌측 50% ReportHistoryPanel, 우측 50% AttendanceSummaryStats
- **`src/features/report/ReportEditor.tsx`** (수정): 사이드바 JSX 제거, TabbedReportForm만 래핑하는 얇은 컴포넌트로 단순화
- **`src/App.tsx`** (수정): `DesktopMode = "edit"|"view"|"roster"|"settings"` 타입 도입, 데스크탑 레이아웃을 `.desktop-layout` CSS Grid 래퍼로 교체, settings 모드 추가
- **`src/styles.css`** (수정): `@media (min-width: 821px) and (pointer: fine)` 내 Grid CSS, 사이드바/하단 패널 스타일, `.top-bar` 데스크탑 숨김, `:focus-visible` 접근성 스타일

### v2.5.2 이전 세션 — 모바일 보고서 삭제 기능
- 최고관리자 전용 모바일 삭제 UI (편집/완료 토글 + 쓰레기통 아이콘)

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **스타일**: 전역 `src/styles.css` (CSS Variables, 다크모드/테마 지원)
- **빌드**: `npm run build`
- **테스트**: `npm test` (Vitest, 31 tests)
- **배포**: GitHub Actions → GitHub Pages (push to main 시 자동)

## 주요 파일
| 파일 | 역할 |
|------|------|
| `src/App.tsx` | 앱 루트, RBAC, 모바일/데스크탑 레이아웃 분기 |
| `src/features/nav/DesktopSidebar.tsx` | 데스크탑 좌측 사이드바 (네비 + 계정 + 액션) |
| `src/features/report/DesktopBottomPanel.tsx` | 데스크탑 하단 패널 (보고서 목록 + 통계) |
| `src/features/report/ReportEditor.tsx` | TabbedReportForm 얇은 래퍼 |
| `src/features/report/TabbedReportForm.tsx` | 탭 기반 보고서 편집폼 |
| `src/features/report/MobileReportList.tsx` | 모바일 보고서 목록 + 편집 모드 삭제 |
| `src/features/auth/useAccounts.ts` | 계정/권한 관리, isSuperAdmin() |
| `src/domain/reportTypes.ts` | MinistryReport 타입 정의 |
| `src/styles.css` | 전역 스타일시트 |

## 데스크탑 레이아웃 구조
```
┌──────────┬──────────────────────────────┐
│          │                              │
│ SIDEBAR  │   CENTER — 보고서 편집폼      │
│  220px   │   (세로 스크롤)               │
│          │                              │
│          ├───────────────┬──────────────┤
│          │  보고서 목록   │    통계       │
│          │    (50%)      │    (50%)     │
└──────────┴───────────────┴──────────────┘
           └──── 하단 패널 220px ──────────┘
```
CSS Grid: `grid-template: "sidebar center" 1fr "sidebar bottom" 220px / 220px 1fr`

## 다음으로 할 수 있는 작업
- 삭제 후 토스트 알림 (현재는 window.confirm만)
- Firestore Security Rules에 RBAC 반영 (현재 프론트엔드 전용)
- 보고서 일괄 삭제
- 설정 모드 UI 개선 (현재는 단순 패널 나열)

## 빌드 & 배포
```bash
npm run build         # Vite 빌드
npm test              # 테스트 실행 (31 tests)
git push origin main  # GitHub Pages 자동 배포
```
