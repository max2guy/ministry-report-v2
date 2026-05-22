# 모바일 헤더 2단 분리 설계

## 문제 진단
현재 헤더 문제는 수치 조정 문제가 아니라 **구조 결합 문제**다.
top-bar와 viewer-tab-bar를 2단으로 분리하고, ResizeObserver/JS 실측/visibility 유지 트릭을 제거한 뒤,
모바일 레이아웃 오프셋을 CSS 상수 기반으로 재구성해야 한다.

### 제거할 불안정 요소
1. `ResizeObserver` — topBarRef 실측으로 `--top-bar-height` 갱신 → JS-CSS 타이밍 불일치
2. `visibility: hidden` 뷰어 탭 — 항상 높이 차지, 조건부 렌더링보다 복잡
3. `--top-bar-height` CSS variable JS 동기화 — 렌더 타이밍마다 흔들림
4. `useLayoutEffect` 내 ResizeObserver — 제거 대상

---

## 목표 구조

```
[Layer 1] <header class="top-bar">        position: fixed; z-index: 100
  - .top-bar-safe-spacer               height: env(safe-area-inset-top, 0px)
  - .top-bar-title-row                 날짜 + 제목 + 아이콘 버튼

[Layer 2] <div class="viewer-tab-bar">    position: fixed; z-index: 99
  - viewer dept tab buttons
  - top: var(--layer1-h)
  - 뷰어 에디터 화면에서만 렌더링 (조건부, visibility 트릭 없음)
```

---

## CSS 상수

```css
/* 모바일 미디어 쿼리 내부 */
:root {
  --layer1-h: calc(env(safe-area-inset-top, 0px) + 48px);
  --layer2-h: 36px;
}
```

- `--layer1-h`: safe-area spacer + title-row 고정 높이(48px)
  - 날짜(11px) + h1(18px) 2줄 + padding + 여유 = 48px 기준
  - 기기 테스트 후 46~50px 범위에서 미세조정 가능
- `--layer2-h`: viewer tab bar 높이
  - 구현 후 기기 확인 필요 (현재 36px 추정)

---

## app-shell 오프셋

```css
/* 모바일 */
.app-shell {
  padding-top: var(--layer1-h);
}
.app-shell.has-viewer-tabs {
  padding-top: calc(var(--layer1-h) + var(--layer2-h));
}
```

React에서 `showViewerTabs` 조건으로 `has-viewer-tabs` 클래스 토글:
```
showViewerTabs = viewerTabs.length > 1
              && appMode === "viewer"
              && mobileTab === "edit"
              && mobileScreen === "editor"
```

---

## 수정 범위

### `src/App.tsx`
- **제거**: `topBarRef`, `useLayoutEffect` + `ResizeObserver` 블록 (line 159-172)
- **제거**: `<header>` 내부 viewer tabs JSX (`viewerTabs.length > 1 && appMode === "viewer" && (...)`)
- **추가**: `<header>` 바로 다음에 독립 `<div class="viewer-tab-bar">` 조건부 렌더링
- **추가**: `app-shell` 또는 상위 div에 `has-viewer-tabs` 클래스 조건부 추가
- **`<header>`**: `ref={topBarRef}` 제거

### `src/styles.css`
- **추가**: `--layer1-h`, `--layer2-h` CSS 변수 정의 (모바일 미디어 쿼리)
- **수정**: `.app-shell` — `padding-top: var(--layer1-h)` (JS 연동 제거)
- **추가**: `.app-shell.has-viewer-tabs` — `padding-top: calc(var(--layer1-h) + var(--layer2-h))`
- **추가**: `.viewer-tab-bar` 스타일
  ```css
  .viewer-tab-bar {
    position: fixed;
    top: var(--layer1-h);
    left: 0;
    right: 0;
    z-index: 99;
    display: flex;
    background: var(--clr-primary);
    height: var(--layer2-h);
  }
  ```
- **추가**: `.viewer-tab-bar { display: none }` — 데스크탑 미디어 쿼리 내
- **수정**: `.top-bar` — `height: 48px` 명시 (safe-spacer 제외, title-row 전용)
  → 실제로는 `top-bar-title-row`에 `height: 48px` 또는 `min-height: 48px` 지정
- **제거**: `.top-bar-viewer-tabs` 스타일 (더 이상 불필요)
- **수정**: `--top-bar-height` 참조 제거 (`.app-shell`의 `--_bar` 계산)

### `package.json`
- 버전 bump: v2.7.1 → v2.7.2

---

## 데스크탑 영향 없음
- `.viewer-tab-bar { display: none }` in desktop media query
- 데스크탑 `.top-bar`는 `position: static` (fixed 아님) — 변화 없음
- `--layer1-h`, `--layer2-h`는 모바일 미디어 쿼리에서만 유효

---

## 검증 기준
구현 후 실기기(iOS/Android)에서 확인:
1. 보고서 모드 스크롤 → 헤더 흔들림 없음
2. 뷰어 모드 → viewer tab bar가 정확히 Layer 1 바로 아래에 위치
3. 뷰어 ↔ 보고서 모드 전환 → 헤더 높이 변동 없음
4. iOS 탄성 스크롤(rubber-banding) → 헤더 안정적
5. 노치/Dynamic Island 기기 → safe-area 처리 정상
6. `--layer2-h: 36px` 실제 탭바 높이와 일치 여부 확인 후 필요 시 조정

---

## 위험 요소
- `top-bar-title-row`의 고정 높이(48px)가 실제 콘텐츠를 클리핑할 경우 → `min-height`로 전환 + `--layer1-h` 재조정
- `env(safe-area-inset-top)` CSS 상수는 JS 없이 정확하게 평가됨 (검증됨)
