# Mobile Editor v2 + Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 편집기에서 데스크톱 사이드바 제거 + 하단 저장바 추가 + 탭 자동 스크롤, 그리고 섹션 배분 초기화 버그·새 보고서 기본 전원출석 버그 수정.

**Architecture:** 버그 2건은 도메인 레이어(`memberRoster.ts`, `reportTypes.ts`)만 수정. 모바일 UI는 `App.tsx`에서 모바일 편집기 렌더 경로를 교체하고 `styles.css`에 저장바 CSS를 추가. `TabbedReportForm.tsx`에서 탭 클릭 시 `scrollIntoView` 호출. 데스크톱 코드는 일절 건드리지 않음.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, CSS custom properties

---

## File Structure

| 파일 | 역할 |
|---|---|
| `src/domain/memberRoster.ts` | `mergeFlatDept`의 group 필드 보존 버그 수정 |
| `src/domain/memberRoster.test.ts` | group 보존 테스트 추가 |
| `src/domain/reportTypes.ts` | `createEmptyReport` 기본 status `"absent"` 변경 |
| `src/domain/reportTypes.test.ts` | 기존 테스트 업데이트 (present→absent, attendance 0) |
| `src/features/report/TabbedReportForm.tsx` | 탭 클릭 시 `scrollIntoView` 호출 |
| `src/App.tsx` | 모바일 편집기 사이드바 제거, 저장바 추가, 계정탭에 내보내기·가져오기 이동 |
| `src/styles.css` | `.mobile-save-bar` CSS 추가 |

---

## Task 1: Bug fix — group 필드 보존 (memberRoster.ts)

**Files:**
- Modify: `src/domain/memberRoster.ts:45-55`
- Modify: `src/domain/memberRoster.test.ts` (테스트 추가)

**Context:** `mergeRosterFromReport`의 내부 함수 `mergeFlatDept`에서 `m.group`이 falsy(undefined/null/"")이면 `group` 필드를 반환 객체에 포함하지 않는다. 이전 데이터를 import할 때 group이 없으면 기존 roster의 섹션 배분이 사라진다. `prev?.group`을 폴백으로 사용하면 된다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/domain/memberRoster.test.ts` 파일 끝에 추가:

```ts
import { describe, expect, it, vi } from "vitest";
import { createDefaultRoster, mergeRosterFromReport } from "./memberRoster";
import type { MinistryReport } from "./reportTypes";

// ... (기존 describe 블록 아래에 추가)

describe("mergeRosterFromReport", () => {
  it("preserves group field from existing roster when report member has no group", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const base = createDefaultRoster();
    // 기존 roster에 group 배분 설정
    const elemDept = base.departments.elementary;
    if (elemDept.kind !== "flat") throw new Error("expected flat");
    elemDept.members[0].group = "A조";
    elemDept.members[1].group = "B조";

    // import할 보고서 — group 필드 없음 (구버전 데이터 시뮬레이션)
    const report = {
      departments: {
        elementary: {
          members: [
            { id: elemDept.members[0].id, name: elemDept.members[0].name, status: "absent" },
            { id: elemDept.members[1].id, name: elemDept.members[1].name, status: "present" },
          ],
        },
        middleHigh: { members: [] },
        youngAdult: { members: [] },
        adult: { zones: [] },
      },
    } as unknown as MinistryReport;

    const merged = mergeRosterFromReport(base, report);
    const mergedElem = merged.departments.elementary;
    if (mergedElem.kind !== "flat") throw new Error("expected flat");

    expect(mergedElem.members[0].group).toBe("A조");
    expect(mergedElem.members[1].group).toBe("B조");
  });

  it("uses report member group when present, overriding existing roster group", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const base = createDefaultRoster();
    const elemDept = base.departments.elementary;
    if (elemDept.kind !== "flat") throw new Error("expected flat");
    elemDept.members[0].group = "A조";

    const report = {
      departments: {
        elementary: {
          members: [
            { id: elemDept.members[0].id, name: elemDept.members[0].name, status: "absent", group: "C조" },
          ],
        },
        middleHigh: { members: [] },
        youngAdult: { members: [] },
        adult: { zones: [] },
      },
    } as unknown as MinistryReport;

    const merged = mergeRosterFromReport(base, report);
    const mergedElem = merged.departments.elementary;
    if (mergedElem.kind !== "flat") throw new Error("expected flat");

    expect(mergedElem.members[0].group).toBe("C조");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --run src/domain/memberRoster.test.ts
```

Expected: FAIL (group이 undefined로 나옴)

- [ ] **Step 3: 버그 수정 구현**

`src/domain/memberRoster.ts` 38-58줄의 `mergeFlatDept` 함수 내 map 블록 수정:

```ts
const merged = reportMembers
  .filter((m) => m.name)
  .map((m): RosterMember => {
    const prev = existingMap.get(m.id);
    const group = m.group ?? prev?.group;
    return {
      id: m.id,
      name: m.name,
      ...(prev?.phone && { phone: prev.phone }),
      ...(group !== undefined && { group }),
      ...(m.role && { role: m.role }),
    };
  });
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --run src/domain/memberRoster.test.ts
```

Expected: PASS (2 new tests pass)

- [ ] **Step 5: 전체 테스트 확인**

```bash
npm test -- --run
```

Expected: 모든 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add src/domain/memberRoster.ts src/domain/memberRoster.test.ts
git commit -m "fix: preserve group field from existing roster in mergeRosterFromReport"
```

---

## Task 2: Bug fix — 새 보고서 기본 absent (reportTypes.ts)

**Files:**
- Modify: `src/domain/reportTypes.ts:261-313`
- Modify: `src/domain/reportTypes.test.ts` (기존 테스트 업데이트)

**Context:** `createEmptyReport`에서 roster 멤버를 새 보고서에 복사할 때 `status: "present" as const`로 전원 출석 초기화. 결석 처리를 안 하면 교구 180명 전원이 출석으로 집계됨. `"absent"`로 바꾸면 새 보고서는 0명 출석으로 시작.

**주의:** `reportTypes.test.ts` 기존 테스트가 `status === "present"`, `attendance === 2`를 단언함. 함께 수정 필요.

- [ ] **Step 1: 기존 테스트 확인**

```bash
npm test -- --run src/domain/reportTypes.test.ts
```

Expected: PASS (현재 통과 중)

- [ ] **Step 2: 테스트를 새 동작 기준으로 업데이트**

`src/domain/reportTypes.test.ts`의 `"creates a versioned v2 report"` 테스트에서:

```ts
// 변경 전
expect(
  report.departments.elementary.members?.every(
    (member) => member.status === "present",
  ),
).toBe(true);
expect(report.departments.elementary.attendance).toBe(2);

// 변경 후
expect(
  report.departments.elementary.members?.every(
    (member) => member.status === "absent",
  ),
).toBe(true);
expect(report.departments.elementary.attendance).toBe(0);
```

- [ ] **Step 3: 업데이트된 테스트 실패 확인**

```bash
npm test -- --run src/domain/reportTypes.test.ts
```

Expected: FAIL (`status === "present"` 단언이 실패)

- [ ] **Step 4: createEmptyReport 기본값 변경**

`src/domain/reportTypes.ts`에서 `createEmptyReport` 함수 내 roster 복사 경로 4곳을 모두 수정:

```ts
// elementaryMembers (267-270줄)
return roster.departments.elementary.members.map(m => ({
  id: m.id, name: m.name, status: "absent" as const, role: m.role, phone: m.phone,
}));

// middleHighMembers (276-279줄)
return roster.departments.middleHigh.members.map(m => ({
  id: m.id, name: m.name, status: "absent" as const, role: m.role, phone: m.phone,
}));

// youngAdultMembers (289-292줄)
return roster.departments.youngAdult.members.map(m => ({
  id: m.id, name: m.name, status: "absent" as const, role: m.role, phone: m.phone,
}));

// adultZones members (307-310줄)
members: z.members.map(m => ({
  id: m.id, name: m.name, status: "absent" as const, role: m.role, phone: m.phone,
})),
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test -- --run src/domain/reportTypes.test.ts
```

Expected: PASS

- [ ] **Step 6: 전체 테스트 확인**

```bash
npm test -- --run
```

Expected: 모든 테스트 통과

- [ ] **Step 7: 커밋**

```bash
git add src/domain/reportTypes.ts src/domain/reportTypes.test.ts
git commit -m "fix: default new report member status to absent (attendance starts at 0)"
```

---

## Task 3: TabbedReportForm — 탭 클릭 시 자동 스크롤

**Files:**
- Modify: `src/features/report/TabbedReportForm.tsx:74-87`

**Context:** `.report-tab-bar`에 이미 `overflow-x: auto`가 있어 스크롤은 됨. 그러나 탭 클릭 시 활성 탭이 화면 밖에 있어도 자동으로 보이게 스크롤되지 않음. 탭 버튼 요소에 ref를 붙이고 클릭 시 `scrollIntoView({ inline: "center", behavior: "smooth" })`를 호출.

- [ ] **Step 1: TabbedReportForm.tsx 탭 바 수정**

`src/features/report/TabbedReportForm.tsx`에서 import 추가 및 탭바 로직 수정:

```tsx
import { useRef, useState } from "react";

// TabbedReportForm 함수 내부 — tabRefs 추가
const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

// setActiveTab 래퍼 함수 추가
function handleTabChange(key: TabKey) {
  setActiveTab(key);
  const btn = tabRefs.current[key];
  btn?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
}
```

탭바 렌더 부분 수정 (74-87줄):

```tsx
<div className="report-tab-bar" role="tablist" aria-label="보고서 섹션">
  {TABS.map((tab) => (
    <button
      key={tab.key}
      ref={(el) => { tabRefs.current[tab.key] = el; }}
      type="button"
      role="tab"
      aria-selected={activeTab === tab.key}
      className={`report-tab-btn${activeTab === tab.key ? " is-active" : ""}`}
      onClick={() => handleTabChange(tab.key)}
    >
      {tab.label}
    </button>
  ))}
</div>
```

- [ ] **Step 2: 빌드 확인 (타입 오류 없음)**

```bash
npm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: TypeScript 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/report/TabbedReportForm.tsx
git commit -m "feat: auto-scroll active section tab into view on mobile"
```

---

## Task 4: 모바일 편집기 개선 — 사이드바 제거 + 저장바 + 계정탭 이동

**Files:**
- Modify: `src/App.tsx:616-696` (모바일 편집기 섹션)
- Modify: `src/styles.css` (`.mobile-save-bar` 추가)

**Context:**
현재 모바일 편집기 경로(`mobileScreen === "editor"`)에서 `ReportEditor`에 `accountPanel`, `importPanel`, `githubPanel`을 넘겨 사이드바가 모바일에 그대로 쌓임.

변경 사항:
1. `ReportEditor`에 `accountPanel={null}`, `importPanel={null}`, `githubPanel={undefined}` 전달 (사이드바 제거)
2. 별도 `<div className="mobile-save-bar">` 추가 (저장하기 버튼)
3. 계정 탭 (`mobileTab === "account"`) 에 내보내기 버튼 + JSON 가져오기 패널 추가

`downloadReport` 헬퍼: `ReportEditor.tsx`에 이미 있으나 private. App.tsx에 동일 함수를 인라인으로 추가.

- [ ] **Step 1: styles.css에 mobile-save-bar 추가**

`src/styles.css` 파일 끝 (`.mobile-account-screen` 블록 이후)에 추가:

```css
/* ── 모바일 저장바 ── */
.mobile-save-bar {
  display: none;
}

@media (max-width: 820px) {
  .mobile-save-bar {
    display: block;
    position: fixed;
    bottom: calc(56px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    padding: 8px 16px;
    background: var(--clr-bg);
    border-top: 1px solid var(--clr-border);
    z-index: 90;
  }

  .mobile-save-bar-btn {
    width: 100%;
    padding: 13px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--clr-primary), color-mix(in srgb, var(--clr-primary) 70%, #000));
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    box-shadow: 0 2px 10px color-mix(in srgb, var(--clr-primary) 40%, transparent);
    transition: opacity 0.15s;
  }

  .mobile-save-bar-btn:disabled {
    opacity: 0.45;
  }

  /* 저장바 공간 확보: 모바일 편집기 콘텐츠 하단 패딩 */
  .mobile-editor-screen .tabbed-report-form {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
```

- [ ] **Step 2: App.tsx에 downloadReport 헬퍼 추가**

`src/App.tsx`의 import 블록 아래, 컴포넌트 함수 선언 위에 추가:

```ts
function downloadCurrentReport(report: MinistryReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.reportDate}-ministry-report-v2.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: 모바일 편집기 섹션 교체**

`src/App.tsx`의 `mobileScreen === "editor"` 분기 (648-695줄)를 아래로 교체:

```tsx
) : (
  <div className="mobile-editor-screen">
    <div className="mobile-editor-back-bar">
      <button
        type="button"
        className="mobile-back-btn"
        onClick={() => setMobileScreen("list")}
      >
        ‹ 보고서 목록
      </button>
      {appMode === "viewer" && (
        <span className="mobile-viewer-badge">뷰어 모드</span>
      )}
    </div>
    {appMode === "reporter" ? (
      <>
        <ReportEditor
          report={report}
          reports={reports}
          accountPanel={null}
          canSave={!!currentAccount}
          importPanel={null}
          historyPanel={null}
          githubPanel={undefined}
          onChange={handleReportChange}
          onNewReport={handleNewReport}
          onSave={handleSave}
          saveErrors={saveErrors}
          saveStatus={saveStatus}
          saveDisabledReason="로그인 후 저장할 수 있습니다."
        />
        <div className="mobile-save-bar">
          <button
            type="button"
            className="mobile-save-bar-btn"
            disabled={!currentAccount}
            onClick={handleSave}
            title={!currentAccount ? "로그인 후 저장할 수 있습니다." : undefined}
          >
            저장하기
          </button>
        </div>
      </>
    ) : (
      <ReportViewer report={report} reports={reports} />
    )}
  </div>
)}
```

- [ ] **Step 4: 계정 탭에 내보내기·가져오기 추가**

`src/App.tsx`의 `mobileTab === "account"` 분기 (617-625줄)를 아래로 교체:

```tsx
{mobileTab === "account" ? (
  <div className="mobile-account-screen">
    <ReporterAccountPanel
      currentAccount={currentAccount}
      onSignOut={() => void handleSignOut()}
    />
    <ThemeSelector />
    <AppModeToggle appMode={appMode} onAppModeChange={setAppMode} />
    <div className="mobile-data-panel">
      <p className="mobile-data-panel-label">데이터</p>
      <div className="mobile-data-panel-actions">
        <button
          type="button"
          className="mobile-data-btn"
          onClick={() => downloadCurrentReport(report)}
        >
          내보내기
        </button>
        <LegacyImportPanel
          warnings={importWarnings}
          onImport={handleImport}
          onImportError={handleImportError}
        />
      </div>
    </div>
    {currentAccount.role === "admin" && <GithubSettingsPanel />}
  </div>
) : mobileTab === "roster" ? (
```

- [ ] **Step 5: styles.css에 mobile-data-panel CSS 추가**

`src/styles.css`의 `.mobile-account-screen` 블록 바로 아래에 추가:

```css
.mobile-data-panel {
  background: var(--clr-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 14px 16px;
}

.mobile-data-panel-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px;
}

.mobile-data-panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-data-btn {
  width: 100%;
  padding: 11px 16px;
  border-radius: 8px;
  border: 1.5px solid var(--clr-border);
  background: var(--clr-card-bg);
  color: var(--clr-text);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
```

- [ ] **Step 6: 빌드 확인**

```bash
npm run build 2>&1 | tail -15
```

Expected: 빌드 성공, TypeScript 오류 없음

- [ ] **Step 7: 전체 테스트 확인**

```bash
npm test -- --run
```

Expected: 모든 테스트 통과

- [ ] **Step 8: 커밋**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: mobile editor — remove sidebar, add bottom save bar, move export/import to account tab"
```

---

## 완료 후

모든 태스크 완료 후 `superpowers:finishing-a-development-branch` 스킬로 마무리.

배포는 main 머지 → GitHub Actions 자동 빌드 → GitHub Pages 업데이트 순서.
