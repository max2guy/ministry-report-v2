# ministry-report-v2 — Codex Handoff (v2.5.4)

## 현재 상태
- 최신 커밋: `e27e9a0 fix(desktop): accessibility + theming for inline panel`
- 브랜치: `main`
- 버전: 2.5.4

## 방금 수정한 내용

### v2.5.4 — 인라인 패널 접근성 + 테마 픽스

**문제**: `DesktopInlinePanel` 보고서 목록 버튼에 접근성 속성 누락, CSS 선택 강조색이 `#2148c0`으로 하드코딩되어 다크모드/테마 변경에 대응 불가.

**해결**:
- `dip-list-load` 버튼에 `aria-label` + `aria-current` 추가 (스크린리더 대응)
- 선택 상태 색상(`is-current` 배경·글자·배지, dup hover)을 `var(--clr-primary)` / `rgba(var(--clr-primary-rgb), 0.08)`로 교체

#### 변경 파일
- **`src/features/report/DesktopInlinePanel.tsx`**: 보고서 불러오기 버튼에 `aria-label`, `aria-current` 속성 추가
- **`src/styles.css`**: `.dip-list-item.is-current`, `.dip-list-badge`, `.dip-list-dup:hover` 등의 하드코딩 색상 → CSS 커스텀 프로퍼티로 교체

### v2.5.3 — 데스크탑 하단 패널 → 인라인 패널 교체

**문제**: 고정 220px 하단 Grid 행(`DesktopBottomPanel`)이 CSS Grid area를 차지해 레이아웃 유연성 저하.

**해결**: 하단 Grid row 제거, 센터 컬럼 내부 하단에 `DesktopInlinePanel` 인라인 배치.

#### 변경 파일
- **`src/features/report/DesktopInlinePanel.tsx`** (신규): 좌측 300px 보고서 목록 + 우측 flex:1 4부서 통계 카드. edit 모드에서만 렌더링.
- **`src/App.tsx`** (수정): `DesktopBottomPanel` import → `DesktopInlinePanel`으로 교체. edit 모드 JSX를 `<>` Fragment로 래핑, `<div className="desktop-edit-area">` + `<DesktopInlinePanel>` 추가.
- **`src/styles.css`** (수정): Grid template에서 bottom row(220px) 제거. `.desktop-center`를 flex column으로 변경. `.desktop-edit-area`(flex:1 스크롤) + `.desktop-inline-panel` 및 `.dip-*` 스타일 추가.

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
| `src/features/report/DesktopInlinePanel.tsx` | 데스크탑 인라인 패널 (보고서 목록 + 4부서 통계) |
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
- `DesktopBottomPanel.tsx` 파일 삭제 (더 이상 사용되지 않음, import 없음)
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
