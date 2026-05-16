# ministry-report-v2 — Codex Handoff (v2.5.4)

## 현재 상태
- 브랜치: `main`
- 최신 커밋: `4b7954f feat(desktop): 보고서 목록을 사이드바로 이동, 하단 패널 제거`
- 후속 정리: dead code 제거 (DesktopInlinePanel.tsx, layout-viz.html, dip-* CSS)

## 방금 수정한 내용
### 데스크탑 레이아웃 재설계 + 사이드바 통합
- **출결 통계 카드를 기본정보 탭 안으로 이동**: `TabbedReportForm.tsx`의 info 탭 내부에 `DEPT_STATS` 4카드(`info-stats-section`) 추가
- **저장된 보고서 목록을 좌측 사이드바로 이동**: `DesktopSidebar.tsx`에 `desktop-sidebar-reports` 섹션 추가, 5개 새 props
- **하단 인라인 패널(`DesktopInlinePanel`) 완전 제거**: App.tsx에서 import·JSX 제거, 파일 삭제
- **Dead code 정리**: `DesktopInlinePanel.tsx` 삭제, `layout-viz.html` 삭제, `styles.css`의 `.desktop-inline-panel`·`.dip-*` CSS 제거

### 파일별 변경 요약
| 파일 | 변경 |
|---|---|
| `src/features/nav/DesktopSidebar.tsx` | reports 5개 props + `desktop-sidebar-reports` 섹션 추가 |
| `src/features/report/TabbedReportForm.tsx` | `DEPT_STATS`, `getDeptTotal`, `info-tab-content` 래퍼, 4카드 stats UI 추가 |
| `src/App.tsx` | DesktopInlinePanel 제거, DesktopSidebar에 reports props 전달 |
| `src/styles.css` | `dsb-*` 사이드바 목록 스타일 추가, `dip-*` 스타일 제거, info-tab-content 카드 스타일 추가 |
| `src/features/report/DesktopInlinePanel.tsx` | **삭제** |

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **빌드**: `npm run build` (Vite, ~1.7s)
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
│  • 저장된 보고서  │        제목/보고일 카드      │
│    목록 (스크롤)  │        출결 통계 4카드      │
│  • 새보고서/저장  │        ReportCanvas        │
│  • ThemeSelector │      [부서] 탭: 기존 유지   │
└──────────────────┴────────────────────────────┘
```

## CSS 클래스 체계
- **사이드바 보고서 목록**: `.desktop-sidebar-reports`, `.dsb-reports-header`, `.dsb-reports-list`, `.dsb-report-item`, `.dsb-report-load`, `.dsb-report-date`, `.dsb-report-title`, `.dsb-report-badge`, `.dsb-report-actions`, `.dsb-report-dup`, `.dsb-report-del`, `.dsb-report-empty`
- **기본정보 탭 카드**: `.info-tab-content`, `.info-fields-card`, `.info-stats-section`, `.info-stats-header`, `.info-stats-month`, `.info-stats-cards`, `.info-stat-card`, `.info-stat-label`, `.info-stat-pct`, `.info-stat-count`, `.info-stat-bar`, `.info-stat-bar-fill`

## 다음으로 할 수 있는 작업
- 사이드바 보고서 목록 스크롤 영역 최적화 (현재 `flex: 1; min-height: 0; overflow-y: auto`)
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
