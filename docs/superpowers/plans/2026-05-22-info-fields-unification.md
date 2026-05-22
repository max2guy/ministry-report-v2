# 편집 폼 기본정보 섹션 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 편집 폼의 보고일/제목 필드를 부서별 보고 아이템과 동일한 시각 언어로 통합한다.

**Architecture:** `src/styles.css` 모바일 미디어쿼리에서 `.info-fields-row`, `.info-field-label`, `.info-field-label input`을 재정의하고 `.info-fields-heading`을 추가한다. `TabbedReportForm.tsx`에 섹션 헤더 `<h3>` 2줄을 삽입한다. 데스크탑 스타일은 별도 블록에 분리되어 있으므로 변화 없다.

**Tech Stack:** CSS (src/styles.css), React 19 TSX (src/features/report/TabbedReportForm.tsx)

---

### Task 1: styles.css — 모바일 info-fields 스타일 재정의

**Files:**
- Modify: `src/styles.css:3939-3965` (`.info-fields-row`, `.info-field-label`, `.info-field-label input`)

> CSS 변경이므로 빌드 통과를 검증 기준으로 한다.

- [ ] **Step 1: `.info-fields-row` 교체 (lines 3940-3947)**

Find:
```css
  /* 보고일/제목 입력 행 */
  .info-fields-row {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    background: var(--clr-card-bg);
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04);
  }
```

Replace with:
```css
  /* 보고일/제목 입력 행 — department-list와 동일 시각 언어 */
  .info-fields-row {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding: 0;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
  }
```

- [ ] **Step 2: `.info-field-label` 교체 (lines 3949-3956)**

Find:
```css
  .info-field-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--clr-text-secondary);
    font-weight: 600;
  }
```

Replace with:
```css
  .info-field-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--clr-text-secondary);
    background: var(--clr-bg);
    border: 1px solid var(--clr-border-soft);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 52px;
  }
```

- [ ] **Step 3: `.info-field-label input` 교체 (lines 3958-3965)**

Find:
```css
  .info-field-label input {
    font-size: 14px;
    border: 1px solid var(--clr-border);
    border-radius: 6px;
    padding: 5px 8px;
    background: var(--clr-bg);
    color: var(--clr-text);
  }
```

Replace with:
```css
  .info-field-label input {
    font-size: 14px;
    font-weight: 700;
    border: none;
    border-radius: 0;
    padding: 0;
    background: transparent;
    color: var(--clr-primary);
    width: 100%;
    min-width: 0;
  }
```

- [ ] **Step 4: `.info-fields-heading` 추가**

바로 위 Step 3 교체 블록 아래에 (즉 `.info-field-label input { }` 닫는 `}` 다음 줄에) 아래를 추가:

```css

  /* 기본정보 섹션 헤더 — .department-section h3 동일 스타일 */
  .info-fields-heading {
    color: var(--clr-text-secondary);
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 2px;
  }
```

- [ ] **Step 5: 데스크탑 미디어쿼리에 `.info-fields-heading { display: none }` 추가**

`src/styles.css` line 3880의 `@media (min-width: 821px) and (pointer: fine)` 블록 안에
`.app-shell { padding: 0; }` 바로 뒤에 추가:

```css
  /* 기본정보 헤더는 모바일 전용 */
  .info-fields-heading {
    display: none;
  }
```

- [ ] **Step 6: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build
```

Expected: `✓ built in ...ms` — 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/styles.css
git commit -m "feat(ui): 모바일 기본정보 필드 — department-list 스타일로 통합"
```

---

### Task 2: TabbedReportForm.tsx — 기본정보 섹션 헤더 추가

**Files:**
- Modify: `src/features/report/TabbedReportForm.tsx:157-159`

- [ ] **Step 1: JSX에 `<h3>` 삽입**

`src/features/report/TabbedReportForm.tsx`에서 아래를 찾아:

```tsx
        <div className="info-tab-content">
          {/* 보고일 / 제목 */}
          <div className="info-fields-row">
```

아래로 교체:

```tsx
        <div className="info-tab-content">
          {/* 기본정보 섹션 헤더 (모바일 전용, 데스크탑은 CSS display:none) */}
          <h3 className="info-fields-heading">기본정보</h3>
          {/* 보고일 / 제목 */}
          <div className="info-fields-row">
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: `✓ built in ...ms` — TypeScript 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/report/TabbedReportForm.tsx
git commit -m "feat(ui): 모바일 기본정보 섹션 헤더 추가"
```

---

### Task 3: 버전 bump v2.7.4 + HANDOFF + 푸시

**Files:**
- Modify: `package.json` (version)
- Modify: `.claude/HANDOFF.md`

- [ ] **Step 1: `package.json` 버전 변경**

```json
"version": "2.7.4",
```
(기존 `"2.7.3"` → `"2.7.4"`)

- [ ] **Step 2: 빌드 재확인**

```bash
npm run build
```

Expected: 성공

- [ ] **Step 3: `.claude/HANDOFF.md` 전체 교체**

```markdown
# ministry-report-v2 — Codex Handoff (v2.7.4)

## 현재 상태
- 브랜치: main
- 버전: 2.7.4

## 방금 수정한 내용

### 문제
모바일 편집 폼에서 보고일/제목 영역이 독립 흰 카드로 스타일링되어
부서별 보고 섹션과 시각 언어가 달라 폼이 분리되어 보였음.

### 해결

#### src/styles.css (모바일 미디어쿼리)
- `.info-fields-row`: 카드 컨테이너 제거 → flex row, gap: 8px, 배경 없음
- `.info-field-label`: department-list li 동일 스타일
  (bg: clr-bg, border: 1px solid clr-border-soft, border-radius: 8px, padding: 10px 12px, min-height: 52px, flex: 1)
- `.info-field-label input`: border/bg 제거, transparent, color: primary, bold
- `.info-fields-heading` 추가: department-section h3 동일 스타일 (13px, bold, clr-text-secondary)
- 데스크탑 미디어쿼리에 `.info-fields-heading { display: none }` 추가

#### src/features/report/TabbedReportForm.tsx
- `info-fields-row` 위에 `<h3 className="info-fields-heading">기본정보</h3>` 추가

## 직전 주요 작업 (v2.7.3)
- 보고서 목록 항목별 독립 카드 분리

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: src/styles.css (단일 CSS 파일)
- **인증/DB**: Firebase Auth + Firestore + FCM
- **빌드**: `npm run build` (Vite + Workbox PWA)
- **개발 서버**: `npm run dev` (localhost:5173, SW 등록 없음)

## 주요 파일
- `src/styles.css` — 전체 스타일시트
- `src/features/report/TabbedReportForm.tsx` — 편집 폼 (기본정보 탭)
- `src/features/report/MobileReportList.tsx` — 보고서 목록
- `src/App.tsx` — 앱 루트

## 다음으로 할 수 있는 작업
- 기기 검증: 모바일에서 기본정보/부서별 보고 시각 통일 확인
- 모바일 헤더 --layer2-h: 36px 실제 탭바 높이 기기 확인 후 조정

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
git commit -m "chore: v2.7.4 — 기본정보 섹션 통합 완료, HANDOFF 갱신"
git push
```
