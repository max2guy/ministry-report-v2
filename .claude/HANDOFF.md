# ministry-report-v2 — Codex Handoff (v2.7.2)

## 현재 상태
- 브랜치: main
- 최신 커밋: e284ec8 fix(a11y): viewer-tab-bar 버튼 role/aria 수정
- 버전: 2.7.2

## 방금 수정한 내용

### 문제
모바일 헤더가 `ResizeObserver` + JS로 `--top-bar-height`를 동적으로 세팅해 스크롤 지터와 첫 렌더링 불안정이 발생했다. 뷰어 탭바가 `visibility:hidden`으로 `<header>` 안에 항상 존재해 높이 계산이 복잡했다.

### 해결 — 모바일 헤더 2단 분리 (v2.7.2)

#### `src/styles.css` (커밋 1357f27)
- 모바일 미디어쿼리에 CSS 상수 추가:
  - `--layer1-h: calc(env(safe-area-inset-top, 0px) + 48px)` — Layer 1 (safe area + 타이틀 행)
  - `--layer2-h: 36px` — Layer 2 (뷰어 탭바 높이, 기기 확인 후 조정 가능)
- `.app-shell` → `padding-top: var(--layer1-h)` (JS 연동 완전 제거)
- `.app-shell.has-viewer-tabs` → `padding-top: calc(var(--layer1-h) + var(--layer2-h))`
- `.viewer-tab-bar` 전역 `display:none` + 모바일 `position:fixed; top:var(--layer1-h)` 스타일 추가
- `.top-bar-viewer-tabs` 스타일 완전 제거

#### `src/App.tsx` (커밋 4e4b322 + e284ec8)
- `topBarRef`, `useLayoutEffect`, `ResizeObserver` 블록 완전 제거
- `useRef`, `useLayoutEffect` import 제거
- `<header>` 내부 뷰어 탭바 블록 (`visibility:hidden`) 제거
- `showViewerTabs` 조건부 const 추가:
  ```tsx
  const showViewerTabs =
    viewerTabs.length > 1 &&
    appMode === "viewer" &&
    mobileTab === "edit" &&
    mobileScreen === "editor";
  ```
- `<main>` → `className={`app-shell${showViewerTabs ? " has-viewer-tabs" : ""}`}`
- `</header>` 직후 독립 `<div className="viewer-tab-bar">` 조건부 렌더링 추가
  - `aria-pressed` 사용 (native button에 role=tab+aria-selected 대신)

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: src/styles.css (단일 CSS 파일)
- **인증/DB**: Firebase Auth + Firestore + FCM
- **빌드**: `npm run build` (Vite + Workbox PWA)
- **개발 서버**: `npm run dev` (localhost:5173, SW 등록 없음)

## 주요 파일
- `src/styles.css` — 전체 스타일시트 (글로벌 + 모바일 미디어쿼리)
- `src/App.tsx` — 앱 루트, `.app-shell` / `.top-bar` / `.viewer-tab-bar` 구조
- `src/components/TopBar.tsx` — 헤더 컴포넌트 (`.top-bar`, `.top-bar-title-row` 포함)

## 다음으로 할 수 있는 작업
- **기기 검증**: iOS/Android 실기기에서 아래 항목 확인
  1. 보고서 모드 스크롤 → 헤더 흔들림 없음
  2. 뷰어 모드 → viewer-tab-bar가 Layer 1 바로 아래 정확히 위치
  3. 뷰어 ↔ 보고서 모드 전환 → 헤더 높이 변동 없음
  4. iOS 탄성 스크롤(rubber-banding) → 헤더 안정적
  5. 노치/Dynamic Island → safe-area 처리 정상
  6. `--layer2-h: 36px` 실제 탭바 높이와 일치 여부 확인 후 필요 시 조정
- **`--layer1-h` 미세조정**: 48px가 기기에서 클리핑되면 `min-height`으로 전환하고 46~50px 범위에서 조정

## 빌드 & 배포
```bash
npm run build       # Vite 빌드 + Workbox SW 생성
npm run dev         # 개발 서버 (localhost:5173, SW 등록 없음)
firebase deploy     # Firebase Hosting 배포
```
