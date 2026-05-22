# ministry-report-v2 — Codex Handoff (v2.6.1)

## 현재 상태
- 브랜치: `main`
- 최신 커밋: `eeb39fa fix(roster): 명단 탭 너비 max-width: 860px로 제한`

## 방금 수정한 내용 (v2.6.x 시리즈)

### v2.6.1 — 명단 탭 너비 제한
- `.desktop-edit-area .roster-tab`: `max-width: none` → `max-width: 860px`

### v2.6.0 — 뷰어 카드 너비 통일 + 계정 카드 라운딩 통일
- `dstats-panel` (뷰어 부서 카드): `width: 100%` 추가, `max-width: 860px` 유지
- 뷰어 탭바(`.viewer-dept-tabs--desktop`)에도 `max-width: 860px` 동기화
- `.account-panel`: `border-radius: 8px → 14px`, `border → box-shadow` (새 카드 스타일 통일)

### v2.5.9 — 데스크탑 상단 여백 축소
- `desktop-layout` padding-top: `16px → 8px`

### v2.5.8 — 뷰어 부서 카드 너비 통일 (1차)
- `.desktop-edit-area .dstats-panel`: `max-width: 860px`, `border → box-shadow`, `border-radius: 14px`

### v2.5.7 — GitHub 백업 설정 패널 너비 통일
- `.desktop-settings .account-panel, .import-panel`: `max-width: none` (컨테이너 680px 채움)

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **빌드**: `npm run build` (Vite, ~3.5s)
- **테스트**: `npm test` (Vitest, 31 tests)
- **배포**: GitHub Actions → GitHub Pages (main 브랜치 push 시 자동)
- **CSS 전략**: CSS Custom Properties (`--clr-primary`, `--clr-bg: #f4f5f7`, `--clr-card-bg`, `--clr-border`), 데스크탑 `@media (min-width: 821px) and (pointer: fine)`

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
│   │   ├── ReportViewer.tsx         — 뷰어 (탭바 + DeptStatsPanel/AdultStatsPanel)
│   │   ├── DeptStatsPanel.tsx       — 유초등부·중고등부·청년부 뷰어 카드 (dstats-panel)
│   │   ├── AdultStatsPanel.tsx      — 교구 뷰어 카드 (dstats-panel)
│   │   ├── ReportCanvas.tsx         — 보고서 미리보기 캔버스
│   │   └── DepartmentAttendanceEditor.tsx
│   └── theme/
│       └── ThemeSelector.tsx
└── auth/
    └── authTypes.ts
```

## 데스크탑 레이아웃 구조
```
┌──────────────────────────────────────────────┐
│  sidebar (220px)  │  center (flex:1)          │
│  border-r:16px    │  border-r:16px            │
│  ─────────────    │  padding: 0 20px 20px     │
│  • 앱 타이틀       │  edit mode: TabbedReportForm (full width)
│  • 계정 정보       │  view mode: dstats-panel (max-w: 860px)
│  • 네비게이션      │  roster mode: roster-tab (max-w: 860px)
│  • 저장된 보고서   │  settings mode: desktop-settings (max-w: 680px)
│  • 새보고서/저장   │
│  • ThemeSelector  │
└──────────────────┴────────────────────────────┘
desktop-layout padding: 8px 16px 16px 16px (top 8px)
```

## 카드 스타일 기준 (통일 완료)
모든 콘텐츠 카드:
```css
border: none;
border-radius: 14px;
box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04);
```
적용 대상: `tabbed-report-form`, `dstats-panel`, `settings-card`, `github-settings-panel`, `account-panel`, `info-stats-section`

## 다음으로 할 수 있는 작업
- 보고서 검색/필터 기능 (사이드바 목록)
- 출결 통계 카드 클릭 시 해당 부서 탭으로 이동
- 모바일에서 출결 통계 조건부 표시

## 빌드 & 배포
```bash
npm run dev          # 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드 → dist/
npm test             # Vitest (31 tests)
git push origin main # → GitHub Actions 자동 배포
```
