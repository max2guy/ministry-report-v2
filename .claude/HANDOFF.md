# ministry-report-v2 — Codex Handoff (v2.5.6)

## 현재 상태
- 브랜치: `main`
- 최신 커밋: `3420998 fix(settings): GitHub 백업 설정 패널 너비를 계정 패널과 일치`

## 방금 수정한 내용
### 설정 화면 카드 너비 통일 (`src/styles.css`)
- **문제**: GitHub 백업 설정 패널이 `desktop-settings` 컨테이너(680px) 전체 너비를 차지해 위의 보고자 계정 카드(420px)와 너비가 달랐음
- **해결**: 데스크탑 미디어 쿼리 안에서 `.desktop-settings .account-panel`과 `.desktop-settings .import-panel`에 `max-width: none` 추가 → 모든 설정 카드가 동일하게 680px 컨테이너 너비를 채움

### 이전 작업 (v2.5.6 전체): Kakao/Naver 스타일 UI + 데스크탑 레이아웃 재설계
- **탭바 언더라인 스타일**: `.report-tab-bar` 배경 흰색, 언더라인 active 표시
- **카드 그림자**: border 제거 → `box-shadow` + `border-radius: 14px`
- **배경색**: `--clr-bg: #f4f5f7`
- **사이드바**: `border-radius: 16px`, 비편집 모드 빈 공간 제거(spacer div)
- **데스크탑 레이아웃**: `padding: 16px; gap: 0 12px; height: 100vh` 그리드
- **뷰어/명단/설정 모드**: 모두 `desktop-edit-area` 래퍼로 감싸 일체감 확보
- **기본정보 탭**: 제목/보고일 입력 카드 삭제, 출결 통계 4카드 유지
- **탭 라운딩**: `.tabbed-report-form`에 `border-radius: 14px; overflow: hidden`

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **빌드**: `npm run build` (Vite, ~3.5s)
- **테스트**: `npm test` (Vitest, 31 tests)
- **배포**: Firebase Hosting (`firebase deploy`)
- **CSS 전략**: CSS Custom Properties (`--clr-primary`, `--clr-card-bg`, `--clr-border`, `--clr-text`), 데스크탑 `@media (min-width: 821px) and (pointer: fine)`

## 주요 파일
```
src/
├── App.tsx                          — 최상위 앱, 라우팅·상태·레이아웃
├── styles.css                       — 전체 스타일 (4,300+ 줄)
├── domain/
│   ├── reportTypes.ts               — MinistryReport, DepartmentKey 등 도메인 타입
│   └── reportMembers.ts             — hasMemberCards, hasZones 유틸
├── features/
│   ├── nav/
│   │   ├── DesktopSidebar.tsx       — 좌측 사이드바 (네비, 계정, 보고서 목록, 액션)
│   │   └── MobileBottomNav.tsx      — 모바일 하단 탭 바
│   ├── report/
│   │   ├── TabbedReportForm.tsx     — 탭 기반 보고서 편집 폼
│   │   ├── ReportCanvas.tsx         — 보고서 미리보기 캔버스
│   │   ├── DepartmentAttendanceEditor.tsx
│   │   └── LegacyDepartmentAttendanceEditor.tsx
│   └── theme/
│       └── ThemeSelector.tsx        — 다크/라이트 테마 토글
└── auth/
    └── authTypes.ts                 — Account 타입
```

## 데스크탑 레이아웃 구조
```
┌──────────────────────────────────────────────┐
│  sidebar (220px) │  center (flex:1)           │
│  ─────────────── │  ──────────────────────    │
│  • 앱 타이틀      │  edit mode:                │
│  • 계정 정보      │    TabbedReportForm        │
│  • 네비게이션     │      [기본정보] 탭:         │
│  • 저장된 보고서  │        출결 통계 4카드      │
│    목록 (스크롤)  │        ReportCanvas        │
│  • 새보고서/저장  │      [부서] 탭: 기존 유지   │
│  • ThemeSelector │  settings mode:            │
│                  │    desktop-settings(680px)  │
│                  │      account-panel(100%)    │
│                  │      import-panel(100%)     │
│                  │      github-panel(100%)     │
└──────────────────┴────────────────────────────┘
```

## CSS 핵심 클래스
- **설정 카드**: `.desktop-settings` (max-width: 680px, flex column, gap: 20px)
  - 안의 `.account-panel`, `.import-panel`, `.github-settings-panel` 모두 max-width: none → 680px 채움
- **탭 폼 카드**: `.tabbed-report-form` (border-radius: 14px, overflow: hidden, box-shadow)
- **탭바**: `.report-tab-bar` (white bg) / `.report-tab-btn.is-active` (border-bottom: 2.5px solid primary)
- **사이드바**: `.desktop-sidebar` (border-radius: 16px, blue bg)
- **레이아웃**: `.desktop-layout` (grid, padding: 16px, gap: 0 12px, height: 100vh)

## 다음으로 할 수 있는 작업
- 사이드바 보고서 목록 스크롤 영역 최적화
- 보고서 검색/필터 기능 (사이드바 목록에 검색창 추가)
- 출결 통계 카드 클릭 시 해당 부서 탭으로 이동
- 모바일에서도 출결 통계 보이도록 조건부 표시 추가

## 빌드 & 배포
```bash
npm run dev          # 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드 → dist/
npm test             # Vitest (31 tests)
firebase deploy      # Firebase Hosting 배포
```
