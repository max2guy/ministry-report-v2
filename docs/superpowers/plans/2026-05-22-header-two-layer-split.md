# 모바일 헤더 2단 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 헤더를 2단(타이틀바 + 뷰어 탭바)으로 분리해 ResizeObserver/JS 실측/visibility 트릭을 제거하고 CSS 상수 기반으로 안정화한다.

**Architecture:** Layer 1(`<header class="top-bar">`)은 safe-area + title-row만 포함하고 고정 높이(`--layer1-h`)로 유지. Layer 2(`<div class="viewer-tab-bar">`)는 `<header>` 외부에 독립 배치되어 `position: fixed; top: var(--layer1-h)`로 정확히 그 아래에 위치. `app-shell`은 CSS 클래스(`has-viewer-tabs`) 토글로 padding-top을 조정하며 JS 실측이 없다.

**Tech Stack:** React 19, TypeScript, CSS Custom Properties (env()), Vitest

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|---|---|---|
| `src/styles.css` | 수정 | CSS 변수 추가, app-shell/top-bar/viewer-tab-bar 스타일 |
| `src/App.tsx` | 수정 | ResizeObserver 제거, 헤더 JSX 재구성 |
| `package.json` | 수정 | v2.7.1 → v2.7.2 버전 bump |
| `.claude/HANDOFF.md` | 수정 | 변경 내용 문서화 |

---

## 배경 지식 (모든 태스크 공통)

### 현재 구조 (제거 대상)
```tsx
// App.tsx line 157-172: ResizeObserver가 topBarRef 높이를 --top-bar-height에 밀어넣음
const topBarRef = useRef<HTMLElement | null>(null);
useLayoutEffect(() => {
  const el = topBarRef.current;
  if (!el) return;
  const update = () =>
    document.documentElement.style.setProperty("--top-bar-height", `${el.offsetHeight}px`);
  update();
  const ro = new ResizeObserver(update);
  ro.observe(el);
  return () => ro.disconnect();
}, []);

// App.tsx line 725-747: visibility:hidden 뷰어 탭이 헤더 안에서 항상 높이를 차지
{viewerTabs.length > 1 && appMode === "viewer" && (
  <div className="viewer-dept-tabs top-bar-viewer-tabs"
    style={{ visibility: ... }}>
    ...
  </div>
)}

// styles.css line 1597-1607: JS가 밀어넣은 --top-bar-height에 의존
.app-shell {
  --_bar: var(--top-bar-height, calc(env(safe-area-inset-top, 0px) + 92px));
  background: linear-gradient(...);
  padding-top: var(--_bar);
}
```

### 목표 구조
```tsx
// App.tsx: ResizeObserver 없음, showViewerTabs 상수로 조건부 렌더링
const showViewerTabs = viewerTabs.length > 1 && appMode === "viewer"
  && mobileTab === "edit" && mobileScreen === "editor";

<main className={`app-shell${showViewerTabs ? " has-viewer-tabs" : ""}`}>
  <header className="top-bar">          {/* Layer 1: 항상 동일 높이 */}
    <div className="top-bar-safe-spacer" />
    <div className="top-bar-title-row">...</div>
    {/* 뷰어 탭 없음 */}
  </header>
  {showViewerTabs && (                  {/* Layer 2: 필요할 때만 렌더 */}
    <div className="viewer-tab-bar">...</div>
  )}
  ...
</main>

// styles.css: CSS 상수, JS 없음
--layer1-h: calc(env(safe-area-inset-top, 0px) + 48px);
--layer2-h: 36px;
.app-shell { padding-top: var(--layer1-h); }
.app-shell.has-viewer-tabs { padding-top: calc(var(--layer1-h) + var(--layer2-h)); }
.viewer-tab-bar { position: fixed; top: var(--layer1-h); height: var(--layer2-h); }
```

---

## Task 1: styles.css — CSS 변수 + 레이아웃 재구성

**Files:**
- Modify: `src/styles.css`

### 변경할 섹션들

**현재 모바일 미디어 쿼리 시작** (line 1558):
```css
@media (max-width: 820px), (pointer: coarse) {
  /* 앱 쉘 */
  .app-shell {
    padding: 0;
  }
```

**현재 `.app-shell` 두 번째 블록** (line 1597-1607):
```css
  .app-shell {
    --_bar: var(--top-bar-height, calc(env(safe-area-inset-top, 0px) + 92px));
    background:
      linear-gradient(
        to bottom,
        var(--clr-primary) 0,
        var(--clr-primary) calc(var(--_bar) + 4px),
        var(--clr-bg)      calc(var(--_bar) + 4px)
      );
    padding-top: var(--_bar);
  }
```

**현재 `.top-bar` 모바일** (line 1565-1581):
```css
  .top-bar {
    background: var(--clr-primary);
    border-radius: 0;
    flex-direction: column;
    align-items: stretch;
    margin: 0;
    padding: 0 0 3px;
    gap: 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-shadow: 0 2px 0 var(--clr-primary);
  }
```

**현재 `.top-bar-title-row` 모바일** (line 1610-1614):
```css
  .top-bar-title-row {
    padding: 4px 12px 0;
    justify-content: space-between;
    margin-bottom: 0;
  }
```

**현재 `.top-bar-viewer-tabs` 전역** (line 278-284):
```css
.top-bar-viewer-tabs {
  display: none;
  border-radius: 8px;
  padding: 4px;
  gap: 2px;
  margin: 6px 0 0;
}
```

**현재 `.top-bar-viewer-tabs` 모바일** (line 1708-1714):
```css
  .top-bar-viewer-tabs {
    display: flex;
    padding: 3px;
    gap: 1px;
    margin: 4px 12px 0;
  }
```

---

- [ ] **Step 1: 모바일 미디어 쿼리에 CSS 변수 추가**

`@media (max-width: 820px), (pointer: coarse) {` 블록 안, 첫 번째 `.app-shell { padding: 0; }` 바로 앞에 삽입:

```css
  /* 모바일 헤더 레이아웃 상수 */
  :root {
    --layer1-h: calc(env(safe-area-inset-top, 0px) + 48px);
    --layer2-h: 36px;
  }
```

- [ ] **Step 2: `.app-shell` 두 번째 블록 교체**

현재 (line 1597-1607):
```css
  .app-shell {
    --_bar: var(--top-bar-height, calc(env(safe-area-inset-top, 0px) + 92px));
    background:
      linear-gradient(
        to bottom,
        var(--clr-primary) 0,
        var(--clr-primary) calc(var(--_bar) + 4px),
        var(--clr-bg)      calc(var(--_bar) + 4px)
      );
    padding-top: var(--_bar);
  }
```

교체 후:
```css
  .app-shell {
    --_bar: var(--layer1-h);
    background:
      linear-gradient(
        to bottom,
        var(--clr-primary) 0,
        var(--clr-primary) calc(var(--_bar) + 4px),
        var(--clr-bg)      calc(var(--_bar) + 4px)
      );
    padding-top: var(--layer1-h);
  }
  .app-shell.has-viewer-tabs {
    --_bar: calc(var(--layer1-h) + var(--layer2-h));
    padding-top: calc(var(--layer1-h) + var(--layer2-h));
  }
```

- [ ] **Step 3: `.top-bar` 모바일 — 하단 패딩 제거**

`padding: 0 0 3px;` → `padding: 0;`

전체 블록 교체:
```css
  .top-bar {
    background: var(--clr-primary);
    border-radius: 0;
    flex-direction: column;
    align-items: stretch;
    margin: 0;
    padding: 0;
    gap: 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-shadow: 0 2px 0 var(--clr-primary);
  }
```

- [ ] **Step 4: `.top-bar-title-row` 모바일 — min-height 추가**

```css
  .top-bar-title-row {
    min-height: 48px;
    padding: 4px 12px 0;
    justify-content: space-between;
    margin-bottom: 0;
  }
```

- [ ] **Step 5: `.viewer-tab-bar` 스타일 추가**

전역 CSS (데스크탑에서 숨김) — `.top-bar-viewer-tabs` 전역 블록 바로 다음에 추가:
```css
/* 독립 뷰어 탭바 — 헤더 Layer 2 (모바일 전용) */
.viewer-tab-bar {
  display: none;
}
```

모바일 미디어 쿼리 안 `.top-bar-viewer-tabs` 모바일 블록 다음에 추가:
```css
  .viewer-tab-bar {
    display: flex;
    position: fixed;
    top: var(--layer1-h);
    left: 0;
    right: 0;
    z-index: 99;
    height: var(--layer2-h);
    background: var(--clr-primary);
    padding: 3px 12px;
    gap: 1px;
    box-shadow: 0 2px 0 var(--clr-primary);
  }
```

- [ ] **Step 6: `.top-bar-viewer-tabs` 스타일 제거**

전역 블록 삭제 (line 278-284):
```css
/* 삭제 대상 */
.top-bar-viewer-tabs {
  display: none;
  border-radius: 8px;
  padding: 4px;
  gap: 2px;
  margin: 6px 0 0;
}
```

모바일 블록 삭제 (line 1708-1714):
```css
/* 삭제 대상 */
  .top-bar-viewer-tabs {
    display: flex;
    padding: 3px;
    gap: 1px;
    margin: 4px 12px 0;
  }
```

- [ ] **Step 7: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 8: 커밋**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/styles.css
git commit -m "feat: 모바일 헤더 CSS 상수화 — layer1/2 변수, viewer-tab-bar 스타일"
```

---

## Task 2: App.tsx — ResizeObserver 제거 + 헤더 JSX 재구성

**Files:**
- Modify: `src/App.tsx`

### 제거할 코드

**line 157-172** — ResizeObserver 블록 전체:
```tsx
  // fixed 헤더 높이를 CSS 변수로 동기화 (모바일 콘텐츠 padding-top 용)
  // useLayoutEffect: 페인트 전에 실행 → 뷰어 탭바 포함 시에도 겹침 없음
  const topBarRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = topBarRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty(
        "--top-bar-height",
        `${el.offsetHeight}px`,
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
```

**line 725-747** — `<header>` 내부 뷰어 탭 블록:
```tsx
        {/* 모바일 뷰어 탭바 — 뷰어 모드에서만 렌더링, visibility:hidden으로 높이 고정 */}
        {viewerTabs.length > 1 && appMode === "viewer" && (
          <div
            className="viewer-dept-tabs top-bar-viewer-tabs"
            style={{
              visibility: (mobileTab === "edit" && mobileScreen === "editor" && appMode === "viewer")
                ? "visible"
                : "hidden",
            }}
            aria-hidden={!(mobileTab === "edit" && mobileScreen === "editor" && appMode === "viewer")}
          >
            {viewerTabs.map((tab, i) => (
              <button
                key={tab.key}
                type="button"
                className={`viewer-dept-tab-btn${i === safeTabIdx ? " is-active" : ""}`}
                onClick={() => setViewerTabIdx(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
```

**line 646** — `ref={topBarRef}` 속성:
```tsx
<header className="top-bar" ref={topBarRef}>
```

---

- [ ] **Step 1: `useRef`, `useLayoutEffect` import 확인 후 제거 여부 결정**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
grep -n "useRef\|useLayoutEffect" src/App.tsx | head -10
```

`topBarRef`에만 `useRef`가 쓰이면 import에서도 제거. 다른 곳에 쓰이면 유지.

- [ ] **Step 2: ResizeObserver 블록 제거**

line 157-172 전체 삭제 (주석 포함):
```tsx
// 삭제: fixed 헤더 높이를 CSS 변수로 동기화...부터
// ...ro.disconnect();
// }, []);
// 까지 전부
```

삭제 후 line 157 위치에는 아무것도 없어야 함 (빈 줄 1개로 정리).

- [ ] **Step 3: `showViewerTabs` 상수 추가**

`viewerTabs`와 `safeTabIdx` 정의 바로 다음 (현재 line 619 근처)에 추가:

```tsx
  const showViewerTabs =
    viewerTabs.length > 1 &&
    appMode === "viewer" &&
    mobileTab === "edit" &&
    mobileScreen === "editor";
```

- [ ] **Step 4: `<main>` 클래스에 has-viewer-tabs 추가**

현재:
```tsx
<main className="app-shell">
```

교체:
```tsx
<main className={`app-shell${showViewerTabs ? " has-viewer-tabs" : ""}`}>
```

- [ ] **Step 5: `<header>` ref 제거**

현재:
```tsx
<header className="top-bar" ref={topBarRef}>
```

교체:
```tsx
<header className="top-bar">
```

- [ ] **Step 6: `<header>` 내부 뷰어 탭 블록 제거**

line 725-747 전체 삭제. `</header>` 닫는 태그(line 748)는 유지.

- [ ] **Step 7: `</header>` 바로 다음에 Layer 2 추가**

현재 line 749:
```tsx
      {/* Mobile-only: MobileReportList home OR editor screen */}
```

그 바로 앞에 삽입:
```tsx
      {/* Layer 2: 뷰어 탭바 — header 외부 독립 배치 */}
      {showViewerTabs && (
        <div className="viewer-tab-bar" role="tablist" aria-label="부서 탭">
          {viewerTabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={i === safeTabIdx}
              className={`viewer-dept-tab-btn${i === safeTabIdx ? " is-active" : ""}`}
              onClick={() => setViewerTabIdx(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
```

- [ ] **Step 8: 빌드 + 테스트 통과 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5 && npm test 2>&1 | tail -5
```

Expected:
```
✓ built in ...
Tests  X passed (X)
```

- [ ] **Step 9: 커밋**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add src/App.tsx
git commit -m "feat: ResizeObserver 제거, 헤더 2단 분리 (viewer-tab-bar 독립)"
```

---

## Task 3: 버전 bump + HANDOFF + 배포

**Files:**
- Modify: `package.json`
- Modify: `.claude/HANDOFF.md`

- [ ] **Step 1: 버전 bump**

`package.json` `"version"` 필드:
```json
"version": "2.7.2",
```

- [ ] **Step 2: 빌드 최종 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: HANDOFF.md 갱신**

`.claude/HANDOFF.md` 전체 교체:

```markdown
# ministry-report-v2 — Codex Handoff (v2.7.2)

## 현재 상태
- 브랜치: main
- 버전: 2.7.2

## 방금 수정한 내용
### 모바일 헤더 2단 분리 (구조 리팩터링)

**문제**: ResizeObserver + --top-bar-height JS 실측 + visibility:hidden 뷰어 탭 조합이
스크롤 꿀렁임, 첫 렌더 불안정, 기기별 차이를 유발하던 구조 결합 문제.

**해결**: 헤더를 2단으로 분리하고 CSS 상수 기반으로 재구성.

- **`src/App.tsx`**
  - 제거: `topBarRef`, `useLayoutEffect` + `ResizeObserver` 블록
  - 제거: `<header>` 내부 `visibility:hidden` 뷰어 탭 JSX
  - 추가: `showViewerTabs` 상수
  - 추가: `<div class="viewer-tab-bar">` — `</header>` 바로 다음 독립 배치
  - 수정: `<main class="app-shell">` → `has-viewer-tabs` 클래스 조건부 토글

- **`src/styles.css`**
  - 추가: `--layer1-h: calc(env(safe-area-inset-top, 0px) + 48px)`
  - 추가: `--layer2-h: 36px`
  - 수정: `.app-shell` — `padding-top: var(--layer1-h)`
  - 추가: `.app-shell.has-viewer-tabs` — `padding-top: calc(var(--layer1-h) + var(--layer2-h))`
  - 추가: `.viewer-tab-bar` — `position: fixed; top: var(--layer1-h); height: var(--layer2-h)`
  - 제거: `.top-bar-viewer-tabs` 스타일 전체

## 검증 항목 (실기기 확인)
- [ ] `--layer2-h: 36px`가 실제 뷰어 탭바 높이와 일치하는지 확인 (필요 시 조정)
- [ ] `--layer1-h`의 48px이 타이틀바 높이와 일치하는지 확인 (필요 시 46~50px 조정)
- [ ] 스크롤 시 헤더 흔들림 없음
- [ ] 뷰어 ↔ 보고서 모드 전환 시 헤더 높이 변동 없음
- [ ] iOS 탄성 스크롤 안정성

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite 6
- **스타일**: 순수 CSS (styles.css 4500줄+)
- **인증/DB**: Firebase Auth (Google OAuth) + Firestore
- **PWA**: vite-plugin-pwa (workbox generateSW)
- **빌드**: `npm run build` | **테스트**: `npm test` (vitest)

## 주요 파일
- `src/App.tsx` — 최상위 컴포넌트
- `src/styles.css` — 전체 CSS
- `src/domain/` — 순수 도메인 로직 (테스트 커버리지 있음)

## 빌드 & 배포
```bash
npm run build && git push   # GitHub Actions → GitHub Pages
```
```

- [ ] **Step 4: 커밋 + 푸시**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
git add package.json .claude/HANDOFF.md
git commit -m "chore(v2.7.2): 버전 bump + HANDOFF 갱신"
git push
```
