# ministry-report-v2 — Codex Handoff (v2.5.3)

## 현재 상태
- 최신 커밋: `c98a305 feat(desktop): replace bottom panel with inline stat cards + wider report list`
- 브랜치: `main`
- 버전: 2.5.3

## 방금 수정한 내용

### 최신 — 데스크탑 하단 패널 → 인라인 패널 교체

**문제**: 고정 220px 하단 Grid 행(`DesktopBottomPanel`)이 CSS Grid area를 차지해 레이아웃 유연성 저하.

**해결**: 하단 Grid row 제거, 센터 컬럼 내부 하단에 `DesktopInlinePanel` 인라인 배치.

#### 변경 파일
- **`src/features/report/DesktopInlinePanel.tsx`** (신규): 좌측 300px 보고서 목록 + 우측 flex:1 4부서 통계 카드. edit 모드에서만 렌더링.
- **`src/App.tsx`** (수정): `DesktopBottomPanel` import → `DesktopInlinePanel`으로 교체. edit 모드 JSX를 `<>` Fragment로 래핑, `<div className="desktop-edit-area">` + `<DesktopInlinePanel>` 추가.
- **`src/styles.css`** (수정): Grid template에서 bottom row(220px) 제거. `.desktop-center`를 flex column으로 변경. `.desktop-edit-area`(flex:1 스크롤) + `.desktop-inline-panel` 및 `.dip-*` 스타일 추가. 기존 `.desktop-bottom-panel` 스타일 제거.

### v2.5.3 — 데스크탑 UI 3단 레이아웃 재구성
- CSS Grid 3단 레이아웃 (sidebar + center + bottom panel)

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
│ SIDEBAR  │   desktop-edit-area          │
│  220px   │   (flex:1, 세로 스크롤)       │
│          │                              │
│          ├───────────────┬──────────────┤
│          │  보고서 목록   │  4부서 통계  │
│          │    300px      │   (flex:1)   │
└──────────┴───────────────┴──────────────┘
           └── desktop-inline-panel 172px ┘
```
CSS Grid: `grid-template: "sidebar center" 1fr / 220px 1fr`
`.desktop-center`: `display:flex; flex-direction:column` — edit-area + inline-panel 수직 배치

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
