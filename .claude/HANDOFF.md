# ministry-report-v2 — Codex Handoff (v2.4.3)

## 현재 상태

최신 커밋: `fix(mobile): move viewer tab bar out of header to fix overlap (v2.4.3)`  
브랜치: `main`

## 방금 수정한 내용 (v2.4.3)

### 문제
모바일에서 뷰어 모드(`appMode=viewer`)로 진입하면 헤더(`position:fixed`) 안에  
`viewer-dept-tabs--in-header` 탭 바가 삽입돼 헤더 높이가 ~40px 늘어났다.  
`--top-bar-height` CSS 변수가 늦게 업데이트되면서 콘텐츠가 탭 바 아래로 겹쳤다.

### 해결 방법
1. **`src/App.tsx`**
   - `<header>` 안의 `viewer-dept-tabs--in-header` div 완전 제거
   - rAF useEffect(`[appMode, mobileScreen]` 의존) 제거
   - 모바일 에디터 화면의 뷰어 분기 안에 `viewer-dept-tabs--mobile-sticky` 추가  
     (헤더 바로 아래 `position: sticky`로 고정)

2. **`src/styles.css`**
   - `.viewer-dept-tabs--in-header` → `.viewer-dept-tabs--mobile-sticky`로 교체
   - `position: sticky; top: var(--top-bar-height, ...); z-index: 50;` 적용
   - `@media (max-width: 820px)` 블록도 동일하게 클래스명 교체

## 프로젝트 개요

| 항목 | 값 |
|---|---|
| 프레임워크 | React 19 + TypeScript + Vite PWA |
| 스타일 | 단일 `src/styles.css` (CSS 변수 기반 테마) |
| 인증/DB | Firebase Auth + Firestore |
| 빌드 | `npm run build` (tsc --noEmit && vite build) |
| 테스트 | `npm test` (vitest) |
| E2E | `npm run smoke` (playwright) |

## 주요 파일

```
src/
  App.tsx                          # 앱 루트. 헤더, 모바일/데스크탑 레이아웃 분기
  styles.css                       # 전체 스타일 (단일 파일)
  features/report/
    ReportViewer.tsx               # 뷰어 + 데스크탑 탭 바 포함
    AdultStatsPanel.tsx            # 교구(adult) 통계 패널
    DeptStatsPanel.tsx             # 기타 부서 통계 패널
    ReportCanvas.tsx               # 통합보고 캔버스
  domain/
    reportTypes.ts                 # MinistryReport, DepartmentKey 등 타입
```

## CSS 핵심 변수

```css
--top-bar-height   /* fixed 헤더 높이 — ResizeObserver가 실시간 업데이트 */
--clr-primary      /* 탭 바 배경색 */
```

## 탭 바 구조 (v2.4.3 기준)

| 위치 | 클래스 | 표시 조건 |
|---|---|---|
| 모바일 콘텐츠 (sticky) | `viewer-dept-tabs--mobile-sticky` | `max-width: 820px` |
| 데스크탑 뷰어 상단 | `viewer-dept-tabs--desktop` | `min-width: 821px` |

## 다음으로 할 수 있는 작업

- 탭 전환 시 스크롤 위치 초기화 (`scrollTop = 0`)
- 탭 바 배경에 blur 효과 추가 (`backdrop-filter: blur(...)`)
- 스와이프 제스처 개선 (현재 `ReportViewer.tsx`의 `handleTouchStart/End`)
- 월별 결석 그래프 인터랙션 추가

## 빌드 & 배포

```bash
npm run build        # 빌드
npm test             # 유닛 테스트
npm run smoke        # E2E (playwright)
# 배포: dist/ 폴더를 Firebase Hosting에 업로드
```
