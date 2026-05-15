# iPad Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아이패드를 포함한 모든 터치 기기에서 모바일 UI가 표시되도록 CSS 미디어쿼리에 `pointer: coarse` 조건을 추가한다.

**Architecture:** `src/styles.css`에서 모바일 전환 기준인 `@media (max-width: 820px)` 9곳을 `@media (max-width: 820px), (pointer: coarse)`로 교체한다. JS 변경 없음. `.mobile-only` / `.desktop-only` 클래스 분기는 이미 올바르게 동작하므로 CSS만 수정한다.

**Tech Stack:** CSS Media Queries Level 4 (`pointer` 특성), Vite 빌드

---

## 파일 구조

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/styles.css` | 수정 | `@media (max-width: 820px)` → `@media (max-width: 820px), (pointer: coarse)` (9곳) |

---

## Task 1: styles.css — 모바일 미디어쿼리에 pointer: coarse 추가

**Files:**
- Modify: `src/styles.css` (아래 9개 줄 번호 기준, 편집 전 확인 필요)

현재 파일에서 `@media (max-width: 820px)` 가 등장하는 줄은 다음과 같다 (줄 번호는 편집 중 변동 가능하므로 sed 명령으로 일괄 교체):

- [ ] **Step 1: 현재 820px 미디어쿼리 개수 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
grep -c "@media (max-width: 820px)" src/styles.css
```

Expected output: `9`

- [ ] **Step 2: sed로 일괄 교체**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
sed -i '' 's/@media (max-width: 820px)/@media (max-width: 820px), (pointer: coarse)/g' src/styles.css
```

- [ ] **Step 3: 교체 결과 확인**

```bash
grep -c "@media (max-width: 820px), (pointer: coarse)" src/styles.css
```

Expected output: `9`

```bash
grep -c "@media (max-width: 820px)$" src/styles.css
```

Expected output: `0` (남은 구(舊) 쿼리 없음)

- [ ] **Step 4: 더 작은 브레이크포인트는 건드리지 않았는지 확인**

```bash
grep "@media (max-width: 500px)" src/styles.css | head -3
grep "@media (max-width: 380px)" src/styles.css | head -3
```

두 쿼리 모두 변경 없이 원래 형태로 유지되어야 한다.

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

오류 없이 빌드 완료 확인.

- [ ] **Step 6: 단위 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 7: 버전 bump + 커밋**

`package.json`의 `"version"` 필드를 `"2.5.0"` → `"2.5.1"`로 변경한 뒤:

```bash
git add src/styles.css package.json
git commit -m "feat(ui): apply mobile layout to touch devices via pointer: coarse (v2.5.1)"
```

- [ ] **Step 8: push**

```bash
git push origin main
```

---

## 자체 검토

**스펙 커버리지:**
- ✅ 아이패드 모든 방향 → 모바일 UI (`pointer: coarse`)
- ✅ 데스크탑 마우스 → 데스크탑 UI (`pointer: fine`, 조건 미충족)
- ✅ 500px/380px 소형 폰 쿼리 유지 (변경 대상 아님)
- ✅ App.tsx 변경 없음

**Placeholder 없음:** 모든 커맨드와 기대 출력 명시됨.
