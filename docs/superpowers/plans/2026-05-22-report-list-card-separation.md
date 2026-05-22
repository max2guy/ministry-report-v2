# 보고서 목록 카드 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보고서 목록의 각 항목을 독립 카드(흰 배경 + 그림자)로 분리해 시각적 구분을 명확히 한다.

**Architecture:** `src/styles.css`만 수정. `.mobile-report-card-list`에서 카드 스타일을 제거하고 `gap`만 남긴다. `.mobile-report-card-row`(항목 래퍼)에 카드 스타일(bg + border-radius + box-shadow)을 이동한다. JSX 변경 없음.

**Tech Stack:** CSS (단일 파일 `src/styles.css`), Vite 빌드

---

### Task 1: styles.css 카드 스타일 분리

**Files:**
- Modify: `src/styles.css:3232-3239` (`.mobile-report-card-list`)
- Modify: `src/styles.css:3241-3254` (`.mobile-report-card`)
- Modify: `src/styles.css:3256-3258` (`.mobile-report-card:last-child` — 삭제)
- Modify: `src/styles.css:3839-3845` (`.mobile-report-card-row`)

> CSS는 단위 테스트가 없으므로 빌드 통과를 검증 기준으로 한다.

- [ ] **Step 1: `.mobile-report-card-list` 수정 — 컨테이너 카드 스타일 제거**

`src/styles.css` line 3232–3239을 아래로 교체:

```css
.mobile-report-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

(제거: `background`, `border-radius`, `box-shadow`, `overflow: hidden`)

- [ ] **Step 2: `.mobile-report-card` 수정 — border-bottom 제거, 독립 카드 스타일 적용**

`src/styles.css` line 3241–3254을 아래로 교체:

```css
.mobile-report-card {
  background: transparent;
  color: inherit;
  font-weight: inherit;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: none;
  text-align: left;
  width: 100%;
  gap: 8px;
}
```

(변경: `border-bottom: 1px solid var(--clr-border-soft)` → `border-bottom: none`)

- [ ] **Step 3: `.mobile-report-card:last-child` 규칙 삭제**

`src/styles.css` line 3256–3258 전체 삭제:

```css
/* 삭제할 블록 */
.mobile-report-card:last-child {
  border-bottom: none;
}
```

- [ ] **Step 4: `.mobile-report-card-row` 수정 — 카드 스타일 이동**

`src/styles.css` line 3839–3845을 아래로 교체:

```css
.mobile-report-card-row {
  display: flex;
  align-items: center;
  background: var(--clr-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

.mobile-report-card-row.is-editing {
  gap: 8px;
  padding-left: 12px;
}
```

(변경: `gap: 8px; margin-bottom: 8px; padding-left: 16px` 제거 → 카드 스타일 추가, 편집 모드 별도 처리)

- [ ] **Step 5: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build
```

Expected: `✓ built in ...ms` — 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/styles.css
git commit -m "feat(ui): 보고서 목록 항목별 독립 카드 분리"
```

---

### Task 2: 버전 bump + HANDOFF.md + 푸시

**Files:**
- Modify: `package.json` (version field)
- Modify: `.claude/HANDOFF.md`

- [ ] **Step 1: `package.json` 버전 변경**

`package.json` line 4:
```json
"version": "2.7.3",
```
(기존 `"2.7.2"` → `"2.7.3"`)

- [ ] **Step 2: 빌드 재확인 (버전 반영)**

```bash
npm run build
```

Expected: `PWA v1.3.0` 또는 버전 정보 포함 빌드 성공

- [ ] **Step 3: `.claude/HANDOFF.md` 갱신**

`.claude/HANDOFF.md` 전체를 아래 내용으로 교체:

```markdown
# ministry-report-v2 — Codex Handoff (v2.7.3)

## 현재 상태
- 브랜치: main
- 최신 커밋: (Task 2 커밋 후 git log --oneline -1로 확인)
- 버전: 2.7.3

## 방금 수정한 내용

### 문제
보고서 목록에서 항목 간 시각적 구분이 어려웠음 (하나의 흰 카드 안에 border-bottom만으로 구분).

### 해결 (src/styles.css)
- `.mobile-report-card-list`: 카드 스타일 제거 → `gap: 10px`만 유지
- `.mobile-report-card-row`: 카드 스타일(bg + border-radius: 12px + box-shadow) 이동
- `.mobile-report-card`: `border-bottom` 제거
- `.mobile-report-card:last-child`: 규칙 삭제 (불필요)
- 편집 모드: `.mobile-report-card-row.is-editing`에 `gap: 8px; padding-left: 12px` 별도 적용

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: src/styles.css (단일 CSS 파일)
- **인증/DB**: Firebase Auth + Firestore + FCM
- **빌드**: `npm run build` (Vite + Workbox PWA)
- **개발 서버**: `npm run dev` (localhost:5173, SW 등록 없음)

## 주요 파일
- `src/styles.css` — 전체 스타일시트
- `src/features/report/MobileReportList.tsx` — 보고서 목록 컴포넌트
- `src/App.tsx` — 앱 루트

## 다음으로 할 수 있는 작업
- 기기 검증: 모바일에서 카드 분리 확인, 편집 모드(삭제 버튼) 레이아웃 확인
- 모바일 헤더 `--layer2-h: 36px` 실제 탭바 높이 기기 확인 후 조정

## 빌드 & 배포
```bash
npm run build
npm run dev         # localhost:5173
firebase deploy --project <project-id>
```
```

- [ ] **Step 4: 커밋 + 푸시**

```bash
git add package.json .claude/HANDOFF.md
git commit -m "chore: v2.7.3 — 보고서 목록 카드 분리 완료, HANDOFF 갱신"
git push
```
