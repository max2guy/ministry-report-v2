# 탭 기반 보고서 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보고서 입력 폼을 6개 탭(기본정보/유초등부/중고등부/청년부/교구/기도·광고)으로 재편하고, 우측 미리보기 패널을 기본정보 탭으로 이동하며, 사이드바 너비를 좁힌다.

**Architecture:** `ReportForm` → `TabbedReportForm`으로 교체. 탭 상태는 컴포넌트 내부 `useState`로 관리. 모든 탭 패널은 `hidden` attribute로 마운트 유지. 미리보기(`ReportCanvas`)는 기본정보 탭 내부로 이동.

**Tech Stack:** React 19, TypeScript, CSS (기존 styles.css 확장)

---

## File Map

| 파일 | 변경 |
|---|---|
| `src/features/report/TabbedReportForm.tsx` | 신규 |
| `src/features/report/ReportEditor.tsx` | 수정 — TabbedReportForm 사용, ReportCanvas 제거 |
| `src/features/report/ReportForm.tsx` | 삭제 |
| `src/styles.css` | 수정 — 탭 스타일, 레이아웃 변경 |

---

## Task 1: TabbedReportForm 생성

**Files:**
- Create: `src/features/report/TabbedReportForm.tsx`

- [ ] **Step 1: 파일 생성**

`src/features/report/TabbedReportForm.tsx` 전체 내용:

```tsx
import { useState } from "react";
import { hasMemberCards, hasZones } from "../../domain/reportMembers";
import type {
  DepartmentKey,
  DepartmentReport,
  MinistryReport,
} from "../../domain/reportTypes";
import { DepartmentAttendanceEditor } from "./DepartmentAttendanceEditor";
import { LegacyDepartmentAttendanceEditor } from "./LegacyDepartmentAttendanceEditor";
import { ReportCanvas } from "./ReportCanvas";

type TabKey =
  | "info"
  | "elementary"
  | "middleHigh"
  | "youngAdult"
  | "adult"
  | "prayer";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "기본정보" },
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
  { key: "prayer", label: "기도·광고" },
];

const DEPT_TABS: { key: Exclude<DepartmentKey, never>; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

type Props = {
  report: MinistryReport;
  onChange: (report: MinistryReport) => void;
};

function textAreaToList(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToText(value: string[]): string {
  return value.join("\n");
}

export function TabbedReportForm({ report, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  function updateReport(patch: Partial<MinistryReport>) {
    const now = new Date().toISOString();
    onChange({ ...report, ...patch, updatedAt: now });
  }

  function updateDepartment(
    key: DepartmentKey,
    patch: Partial<DepartmentReport>,
  ) {
    updateReport({
      departments: {
        ...report.departments,
        [key]: { ...report.departments[key], ...patch },
      },
    });
  }

  return (
    <div className="tabbed-report-form">
      <div className="report-tab-bar" role="tablist" aria-label="보고서 섹션">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`report-tab-btn${activeTab === tab.key ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 기본정보 탭 */}
      <div
        className="report-tab-panel"
        role="tabpanel"
        hidden={activeTab !== "info"}
      >
        <fieldset>
          <legend>기본 정보</legend>
          <label>
            제목
            <input
              value={report.title}
              onChange={(e) => updateReport({ title: e.currentTarget.value })}
            />
          </label>
          <label>
            보고일
            <input
              type="date"
              value={report.reportDate}
              onChange={(e) =>
                updateReport({ reportDate: e.currentTarget.value })
              }
            />
          </label>
          <label>
            보고자
            <input
              value={report.pastorName}
              onChange={(e) =>
                updateReport({ pastorName: e.currentTarget.value })
              }
            />
          </label>
        </fieldset>
        <ReportCanvas report={report} />
      </div>

      {/* 부서 탭 (유초등부·중고등부·청년부·교구) */}
      {DEPT_TABS.map(({ key }) => {
        const department = report.departments[key];
        return (
          <div
            key={key}
            className="report-tab-panel"
            role="tabpanel"
            hidden={activeTab !== key}
          >
            <section className="department-edit">
              <h3>{department.name}</h3>
              {hasMemberCards(department) || hasZones(department) ? (
                <>
                  <DepartmentAttendanceEditor
                    department={department}
                    reportDate={report.reportDate}
                    onChange={(nextKey, nextDept) =>
                      updateDepartment(nextKey, nextDept)
                    }
                  />
                  <label>
                    새가족
                    <input
                      min="0"
                      type="number"
                      value={
                        department.newVisitors === 0
                          ? ""
                          : String(department.newVisitors)
                      }
                      onChange={(e) =>
                        updateDepartment(key, {
                          newVisitors:
                            Number(e.currentTarget.value) || 0,
                        })
                      }
                    />
                  </label>
                </>
              ) : (
                <LegacyDepartmentAttendanceEditor
                  department={department}
                  onChange={updateDepartment}
                />
              )}
              <label>
                요약
                <textarea
                  rows={3}
                  value={department.summary}
                  onChange={(e) =>
                    updateDepartment(key, { summary: e.currentTarget.value })
                  }
                />
              </label>
            </section>
          </div>
        );
      })}

      {/* 기도·광고 탭 */}
      <div
        className="report-tab-panel"
        role="tabpanel"
        hidden={activeTab !== "prayer"}
      >
        <fieldset>
          <legend>기도와 광고</legend>
          <label>
            기도제목
            <textarea
              rows={4}
              value={listToText(report.prayerRequests)}
              onChange={(e) =>
                updateReport({
                  prayerRequests: textAreaToList(e.currentTarget.value),
                })
              }
            />
          </label>
          <label>
            광고 / 다음 계획
            <textarea
              rows={4}
              value={listToText(report.announcements)}
              onChange={(e) =>
                updateReport({
                  announcements: textAreaToList(e.currentTarget.value),
                })
              }
            />
          </label>
        </fieldset>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입스크립트 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npx tsc --noEmit 2>&1
```

Expected: 오류 없음 (또는 이 파일과 무관한 기존 오류만)

- [ ] **Step 3: 커밋**

```bash
git add src/features/report/TabbedReportForm.tsx
git commit -m "feat: add TabbedReportForm with 6-tab layout"
```

---

## Task 2: ReportEditor 업데이트

**Files:**
- Modify: `src/features/report/ReportEditor.tsx`

현재 `ReportEditor`는 `editor-workspace` 안에 `ReportForm` + `ReportCanvas`를 2열로 배치한다. `TabbedReportForm`으로 교체하고 `ReportCanvas`를 제거한다(기본정보 탭으로 이동했으므로).

- [ ] **Step 1: ReportEditor 수정**

`src/features/report/ReportEditor.tsx` 전체를 아래로 교체:

```tsx
import type { ReactNode } from "react";
import type { MinistryReport } from "../../domain/reportTypes";
import { TabbedReportForm } from "./TabbedReportForm";

type ReportEditorProps = {
  report: MinistryReport;
  accountPanel: ReactNode;
  canSave: boolean;
  historyPanel: ReactNode;
  importPanel: ReactNode;
  onChange: (report: MinistryReport) => void;
  onNewReport: () => void;
  onSave: () => void;
  saveErrors: string[];
  saveStatus: string;
  saveDisabledReason?: string;
};

function downloadReport(report: MinistryReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.reportDate}-ministry-report-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportEditor({
  report,
  accountPanel,
  canSave,
  historyPanel,
  importPanel,
  onChange,
  onNewReport,
  onSave,
  saveErrors,
  saveStatus,
  saveDisabledReason,
}: ReportEditorProps) {
  return (
    <section className="report-mode">
      <aside className="edit-panel" aria-label="보고서 편집">
        {accountPanel}
        <button type="button" onClick={onNewReport}>
          새 보고서
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          title={saveDisabledReason}
        >
          저장
        </button>
        <button type="button" onClick={() => downloadReport(report)}>
          내보내기
        </button>
        {importPanel}
        {historyPanel}
        {saveErrors.length ? (
          <section className="save-errors" aria-label="저장 오류" role="alert">
            <h2>저장 오류</h2>
            <ul>
              {saveErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {saveStatus ? <p role="status">{saveStatus}</p> : null}
      </aside>
      <div className="editor-workspace">
        <TabbedReportForm report={report} onChange={onChange} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 타입스크립트 확인**

```bash
npx tsc --noEmit 2>&1
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/report/ReportEditor.tsx
git commit -m "feat: replace ReportForm with TabbedReportForm in ReportEditor"
```

---

## Task 3: CSS — 탭 스타일 + 레이아웃 변경

**Files:**
- Modify: `src/styles.css`

변경 내용:
1. `.report-mode` grid: `minmax(220px, 280px)` → `200px` (사이드바 좁게)
2. `.editor-workspace`: 2열 → 1열 (TabbedReportForm이 전체 너비 사용)
3. 탭 스타일 추가: `.report-tab-bar`, `.report-tab-btn`, `.report-tab-btn.is-active`, `.report-tab-panel`, `.tabbed-report-form`

- [ ] **Step 1: `.report-mode` 사이드바 너비 변경**

`src/styles.css`에서 아래 부분을 찾아 수정:

```css
/* 변경 전 */
.report-mode {
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  padding-top: 28px;
}
```

```css
/* 변경 후 */
.report-mode {
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: 200px minmax(0, 1fr);
  padding-top: 28px;
}
```

- [ ] **Step 2: `.editor-workspace` 1열로 변경**

```css
/* 변경 전 */
.editor-workspace {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
}
```

```css
/* 변경 후 */
.editor-workspace {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr);
}
```

- [ ] **Step 3: 탭 스타일 추가**

`styles.css` 끝부분(기존 CSS 뒤)에 추가:

```css
/* ── TabbedReportForm ── */
.tabbed-report-form {
  background: #ffffff;
  border: 1px solid #d9ded6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.report-tab-bar {
  border-bottom: 1px solid #d9ded6;
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 8px 8px 0;
  scrollbar-width: none;
}

.report-tab-bar::-webkit-scrollbar {
  display: none;
}

.report-tab-btn {
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  color: #556b64;
  flex-shrink: 0;
  font-size: 14px;
  padding: 8px 16px;
  white-space: nowrap;
}

.report-tab-btn.is-active {
  background: #ffffff;
  border-color: #d9ded6;
  border-bottom-color: #ffffff;
  color: #24564a;
  font-weight: 600;
  margin-bottom: -1px;
}

.report-tab-panel {
  padding: 20px;
}

.report-tab-panel[hidden] {
  display: none;
}
```

- [ ] **Step 4: 모바일 미디어 쿼리 업데이트**

`@media (max-width: 820px)` 블록에서 아래 부분을 찾아:

```css
.report-mode,
.editor-workspace,
.report-meta,
.department-list,
.memo-section {
  grid-template-columns: 1fr;
}
```

`editor-workspace`를 목록에서 제거한다 (이미 1열이므로 중복):

```css
.report-mode,
.report-meta,
.department-list,
.memo-section {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -15
```

Expected: `✓ built in ...ms` 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add src/styles.css
git commit -m "style: tabbed report form layout — sidebar 200px, 1-col workspace, tab bar"
```

---

## Task 4: ReportForm.tsx 삭제

**Files:**
- Delete: `src/features/report/ReportForm.tsx`

- [ ] **Step 1: 파일이 더 이상 임포트되지 않는지 확인**

```bash
grep -r "ReportForm" src/ --include="*.tsx" --include="*.ts"
```

Expected: `TabbedReportForm.tsx` 내부 참조만 없어야 함. `ReportForm`을 임포트하는 파일이 없어야 한다.

- [ ] **Step 2: 파일 삭제**

```bash
rm src/features/report/ReportForm.tsx
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ built in ...ms`

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: remove ReportForm.tsx (replaced by TabbedReportForm)"
```

---

## Task 5: 브라우저 확인

- [ ] **Step 1: 프리뷰 서버 재시작**

```bash
lsof -ti:4174 | xargs kill -9 2>/dev/null
npm run preview -- --port 4174 &
```

- [ ] **Step 2: 브라우저에서 확인 체크리스트**

http://localhost:4174/ 열어서:

1. 상단 탭 바(기본정보/유초등부/중고등부/청년부/교구/기도·광고) 표시 확인
2. 기본정보 탭: 제목·보고일·보고자 입력 + 미리보기 렌더링 확인
3. 유초등부 탭: 권상우·천주아 카드 표시 확인
4. 교구 탭: 1교구/2교구 구역 카드 표시 확인
5. 기도·광고 탭: textarea 표시 확인
6. 탭 전환 후 돌아왔을 때 입력 내용 유지 확인
7. 사이드바가 기존보다 좁아졌는지 확인
