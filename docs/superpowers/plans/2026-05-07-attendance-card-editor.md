# Attendance Card Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert new-report attendance editing to a name-card workflow, fix church name to `연천장로교회`, and preserve compatibility with existing numeric-only imported reports.

**Architecture:** Extend the department model with optional member cards, treat `attendance` as a derived value for card-backed reports, and preserve the current numeric path as a legacy fallback for imported reports without member lists. Keep history/viewer/backup contracts centered on `attendance`, so the new UI plugs into the existing summary pipeline instead of replacing it.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright

---

## File Structure

- Modify: `Projects/ministry-report-v2/src/domain/reportTypes.ts`
  - Add member-card types, fixed church default, and new-report default member seeds.
- Modify: `Projects/ministry-report-v2/src/domain/reportTypes.test.ts`
  - Cover fixed church name, seeded elementary members, and card-derived attendance behavior.
- Create: `Projects/ministry-report-v2/src/domain/reportMembers.ts`
  - Card helper functions for attendance derivation, toggling, adding members, and legacy detection.
- Create: `Projects/ministry-report-v2/src/domain/reportMembers.test.ts`
  - Focused tests for member-card helpers.
- Modify: `Projects/ministry-report-v2/src/domain/reportImport.ts`
  - Read optional `members` arrays from v2 payloads without requiring them.
- Modify: `Projects/ministry-report-v2/src/domain/reportImport.test.ts`
  - Verify import accepts card-backed reports and still accepts numeric-only reports.
- Modify: `Projects/ministry-report-v2/src/features/report/ReportForm.tsx`
  - Replace new-report numeric attendance editing with card UI, fixed church display, and legacy fallback.
- Create: `Projects/ministry-report-v2/src/features/report/DepartmentAttendanceEditor.tsx`
  - Focused card-editor surface for one department.
- Create: `Projects/ministry-report-v2/src/features/report/LegacyDepartmentAttendanceEditor.tsx`
  - Small fallback for imported reports that only have numeric attendance.
- Modify: `Projects/ministry-report-v2/src/styles.css`
  - Add card editor styles and fixed church display styles.
- Modify: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`
  - Add end-to-end coverage for fixed church name, elementary default cards, card toggling, member add, and legacy numeric fallback.

## Task 1: Extend The Report Model For Attendance Cards

**Files:**
- Modify: `Projects/ministry-report-v2/src/domain/reportTypes.ts`
- Test: `Projects/ministry-report-v2/src/domain/reportTypes.test.ts`

- [x] **Step 1: Write the failing tests for fixed church and seeded members**

```ts
import { describe, expect, it } from "vitest";
import { createEmptyReport } from "./reportTypes";

describe("createEmptyReport", () => {
  it("fixes the church name to 연천장로교회", () => {
    const report = createEmptyReport(new Date("2026-05-07T00:00:00.000Z"));
    expect(report.churchName).toBe("연천장로교회");
  });

  it("seeds elementary attendance cards", () => {
    const report = createEmptyReport(new Date("2026-05-07T00:00:00.000Z"));
    expect(report.departments.elementary.members?.map((member) => member.name)).toEqual([
      "권상우",
      "천주아",
    ]);
    expect(report.departments.elementary.members?.every((member) => member.status === "absent")).toBe(true);
    expect(report.departments.elementary.attendance).toBe(0);
  });
});
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- src/domain/reportTypes.test.ts`
Expected: FAIL because `churchName` is empty and `members` is undefined.

- [x] **Step 3: Add member types and new defaults in reportTypes**

```ts
export type DepartmentMemberStatus = "present" | "absent";

export type DepartmentMember = {
  id: string;
  name: string;
  status: DepartmentMemberStatus;
};

export type DepartmentReport = {
  key: DepartmentKey;
  name: string;
  attendance: number;
  newVisitors: number;
  summary: string;
  members?: DepartmentMember[];
};

function createSeededMembers(names: string[]): DepartmentMember[] {
  return names.map((name) => ({
    id: crypto.randomUUID(),
    name,
    status: "absent",
  }));
}

export function createEmptyReport(now = new Date()): MinistryReport {
  return {
    id: crypto.randomUUID(),
    schemaVersion: 2,
    title: "주간 사역보고서",
    reportDate: now.toISOString().slice(0, 10),
    churchName: "연천장로교회",
    reporterName: "",
    departments: {
      elementary: {
        key: "elementary",
        name: "유초등부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
        members: createSeededMembers(["권상우", "천주아"]),
      },
      middleHigh: {
        key: "middleHigh",
        name: "중고등부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
        members: [],
      },
      youngAdult: {
        key: "youngAdult",
        name: "청년부",
        attendance: 0,
        newVisitors: 0,
        summary: "",
        members: [],
      },
      adult: {
        key: "adult",
        name: "장년",
        attendance: 0,
        newVisitors: 0,
        summary: "",
        members: [],
      },
    },
    prayerRequests: "",
    announcements: "",
  };
}
```

- [x] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- src/domain/reportTypes.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/domain/reportTypes.ts Projects/ministry-report-v2/src/domain/reportTypes.test.ts
git commit -m "feat: seed attendance card members"
```

## Task 2: Add Member-Card Helper Logic

**Files:**
- Create: `Projects/ministry-report-v2/src/domain/reportMembers.ts`
- Create: `Projects/ministry-report-v2/src/domain/reportMembers.test.ts`

- [x] **Step 1: Write failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import type { DepartmentReport } from "./reportTypes";
import {
  addDepartmentMember,
  deriveAttendanceFromMembers,
  hasMemberCards,
  toggleDepartmentMember,
} from "./reportMembers";

function sampleDepartment(): DepartmentReport {
  return {
    key: "elementary",
    name: "유초등부",
    attendance: 0,
    newVisitors: 0,
    summary: "",
    members: [
      { id: "a", name: "권상우", status: "absent" },
      { id: "b", name: "천주아", status: "present" },
    ],
  };
}

describe("reportMembers", () => {
  it("derives attendance from present members", () => {
    expect(deriveAttendanceFromMembers(sampleDepartment())).toBe(1);
  });

  it("toggles one member status", () => {
    const updated = toggleDepartmentMember(sampleDepartment(), "a");
    expect(updated.members?.find((member) => member.id === "a")?.status).toBe("present");
    expect(updated.attendance).toBe(2);
  });

  it("adds a new absent member", () => {
    const updated = addDepartmentMember(sampleDepartment(), "새친구");
    expect(updated.members?.at(-1)).toMatchObject({ name: "새친구", status: "absent" });
    expect(updated.attendance).toBe(1);
  });

  it("treats missing members as legacy numeric mode", () => {
    expect(hasMemberCards({ ...sampleDepartment(), members: undefined })).toBe(false);
  });
});
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- src/domain/reportMembers.test.ts`
Expected: FAIL because helper module does not exist yet.

- [x] **Step 3: Implement the helper module**

```ts
import type { DepartmentMember, DepartmentReport } from "./reportTypes";

export function hasMemberCards(department: DepartmentReport): boolean {
  return Array.isArray(department.members);
}

export function deriveAttendanceFromMembers(department: DepartmentReport): number {
  if (!department.members) return department.attendance;
  return department.members.filter((member) => member.status === "present").length;
}

function cloneMembers(members: DepartmentMember[]): DepartmentMember[] {
  return members.map((member) => ({ ...member }));
}

export function toggleDepartmentMember(
  department: DepartmentReport,
  memberId: string,
): DepartmentReport {
  if (!department.members) return department;
  const members = cloneMembers(department.members).map((member) =>
    member.id === memberId
      ? { ...member, status: member.status === "present" ? "absent" : "present" }
      : member,
  );
  return {
    ...department,
    members,
    attendance: members.filter((member) => member.status === "present").length,
  };
}

export function addDepartmentMember(
  department: DepartmentReport,
  name: string,
): DepartmentReport {
  const trimmed = name.trim();
  if (!trimmed || !department.members) return department;
  const members = cloneMembers(department.members);
  if (members.some((member) => member.name.trim() === trimmed)) return department;
  members.push({
    id: crypto.randomUUID(),
    name: trimmed,
    status: "absent",
  });
  return {
    ...department,
    members,
    attendance: members.filter((member) => member.status === "present").length,
  };
}
```

- [x] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- src/domain/reportMembers.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/domain/reportMembers.ts Projects/ministry-report-v2/src/domain/reportMembers.test.ts
git commit -m "feat: add attendance card helpers"
```

## Task 3: Preserve Members Through Import And Backup

**Files:**
- Modify: `Projects/ministry-report-v2/src/domain/reportImport.ts`
- Modify: `Projects/ministry-report-v2/src/domain/reportImport.test.ts`

- [x] **Step 1: Write failing import tests for card-backed reports**

```ts
it("preserves imported members when present in a v2 report", () => {
  const imported = parseImportRecords([
    {
      schemaVersion: 2,
      title: "카드형 보고",
      reportDate: "2026-05-07",
      churchName: "연천장로교회",
      departments: {
        elementary: {
          attendance: 1,
          members: [
            { id: "a", name: "권상우", status: "present" },
            { id: "b", name: "천주아", status: "absent" },
          ],
        },
      },
    },
  ]);

  expect(imported[0].report.departments.elementary.members).toHaveLength(2);
  expect(imported[0].report.departments.elementary.attendance).toBe(1);
});
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- src/domain/reportImport.test.ts`
Expected: FAIL because imported members are dropped.

- [x] **Step 3: Extend import normalization for optional members**

```ts
function normalizeMember(value: unknown) {
  const member = objectRecord(value);
  return {
    id: text(member.id) || crypto.randomUUID(),
    name: text(member.name),
    status: text(member.status) === "present" ? "present" : "absent",
  } as const;
}

function normalizeMembers(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map(normalizeMember)
    .filter((member) => member.name.trim().length > 0);
}

function normalizeDepartment(key: DepartmentKey, value: unknown): DepartmentReport {
  const department = objectRecord(value);
  const members = normalizeMembers(department.members);
  return {
    key,
    name: departmentName(key),
    attendance: numberValue(department.attendance),
    newVisitors: numberValue(department.newVisitors),
    summary: text(department.summary),
    members,
  };
}
```

- [x] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- src/domain/reportImport.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/src/domain/reportImport.ts Projects/ministry-report-v2/src/domain/reportImport.test.ts
git commit -m "feat: preserve imported attendance cards"
```

## Task 4: Build The Department Card Editor UI

**Files:**
- Create: `Projects/ministry-report-v2/src/features/report/DepartmentAttendanceEditor.tsx`
- Create: `Projects/ministry-report-v2/src/features/report/LegacyDepartmentAttendanceEditor.tsx`
- Modify: `Projects/ministry-report-v2/src/features/report/ReportForm.tsx`
- Modify: `Projects/ministry-report-v2/src/styles.css`

- [x] **Step 1: Add a focused card editor component**

```tsx
import { useState } from "react";
import type { DepartmentReport } from "../../domain/reportTypes";

type DepartmentAttendanceEditorProps = {
  department: DepartmentReport;
  onToggle: (memberId: string) => void;
  onAddMember: (name: string) => void;
};

export function DepartmentAttendanceEditor({
  department,
  onToggle,
  onAddMember,
}: DepartmentAttendanceEditorProps) {
  const [draftName, setDraftName] = useState("");

  return (
    <div className="attendance-card-editor">
      <div className="attendance-card-list">
        {department.members?.map((member) => (
          <button
            key={member.id}
            type="button"
            className={`attendance-card status-${member.status}`}
            onClick={() => onToggle(member.id)}
          >
            <span>{member.name}</span>
            <small>{member.status === "present" ? "출석" : "결석"}</small>
          </button>
        ))}
      </div>
      <div className="attendance-add-row">
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.currentTarget.value)}
          placeholder="이름 추가"
        />
        <button
          type="button"
          onClick={() => {
            onAddMember(draftName);
            setDraftName("");
          }}
        >
          인원 추가
        </button>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Add a tiny legacy fallback editor**

```tsx
import type { DepartmentReport } from "../../domain/reportTypes";

type LegacyDepartmentAttendanceEditorProps = {
  department: DepartmentReport;
  onAttendanceChange: (attendance: number) => void;
};

export function LegacyDepartmentAttendanceEditor({
  department,
  onAttendanceChange,
}: LegacyDepartmentAttendanceEditorProps) {
  return (
    <label>
      출석
      <input
        type="number"
        min={0}
        value={department.attendance ? department.attendance.toString() : ""}
        onChange={(event) => onAttendanceChange(Number(event.currentTarget.value) || 0)}
      />
    </label>
  );
}
```

- [x] **Step 3: Wire the new editors into ReportForm**

```tsx
import {
  addDepartmentMember,
  hasMemberCards,
  toggleDepartmentMember,
} from "../../domain/reportMembers";
import { DepartmentAttendanceEditor } from "./DepartmentAttendanceEditor";
import { LegacyDepartmentAttendanceEditor } from "./LegacyDepartmentAttendanceEditor";

function updateDepartment(
  key: DepartmentKey,
  recipe: (department: DepartmentReport) => DepartmentReport,
) {
  onChange({
    ...report,
    departments: {
      ...report.departments,
      [key]: recipe(report.departments[key]),
    },
  });
}

<div className="field-readonly">
  <span>교회</span>
  <strong>{report.churchName}</strong>
</div>

{DEPARTMENT_KEYS.map((key) => {
  const department = report.departments[key];
  return (
    <section className="department-edit" key={key}>
      <h3>{department.name}</h3>
      {hasMemberCards(department) ? (
        <DepartmentAttendanceEditor
          department={department}
          onToggle={(memberId) =>
            updateDepartment(key, (current) => toggleDepartmentMember(current, memberId))
          }
          onAddMember={(name) =>
            updateDepartment(key, (current) => addDepartmentMember(current, name))
          }
        />
      ) : (
        <LegacyDepartmentAttendanceEditor
          department={department}
          onAttendanceChange={(attendance) =>
            updateDepartment(key, (current) => ({ ...current, attendance }))
          }
        />
      )}
      // keep newVisitors and summary inputs
    </section>
  );
})}
```

- [x] **Step 4: Add minimal styles for card editing**

```css
.field-readonly {
  display: grid;
  gap: 0.35rem;
}

.attendance-card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.attendance-card {
  min-width: 96px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
  background: #fff;
}

.attendance-card.status-present {
  border-color: #2563eb;
  background: #eff6ff;
}

.attendance-add-row {
  display: flex;
  gap: 0.5rem;
}
```

- [x] **Step 5: Run a focused build check**

Run: `npm run build`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add Projects/ministry-report-v2/src/features/report/DepartmentAttendanceEditor.tsx Projects/ministry-report-v2/src/features/report/LegacyDepartmentAttendanceEditor.tsx Projects/ministry-report-v2/src/features/report/ReportForm.tsx Projects/ministry-report-v2/src/styles.css
git commit -m "feat: add attendance card editor ui"
```

## Task 5: Add Smoke Coverage For Card Editing And Church Fixing

**Files:**
- Modify: `Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts`

- [x] **Step 1: Add a smoke test for fixed church name and default elementary cards**

```ts
test("starts new reports with a fixed church name and default elementary cards", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("연천장로교회")).toBeVisible();
  await expect(page.getByRole("button", { name: "권상우" })).toBeVisible();
  await expect(page.getByRole("button", { name: "천주아" })).toBeVisible();
});
```

- [x] **Step 2: Add a smoke test for card toggling and member add**

```ts
test("updates attendance from card toggles and added members", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "권상우" }).click();
  await expect(page.locator(".report-canvas")).toContainText("1명");

  await page.getByPlaceholder("이름 추가").fill("새친구");
  await page.getByRole("button", { name: "인원 추가" }).click();
  await expect(page.getByRole("button", { name: "새친구" })).toBeVisible();
});
```

- [x] **Step 3: Add a smoke test for legacy numeric fallback**

```ts
test("keeps numeric attendance editing for imported reports without members", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([{ date: "2026-04-19", youth: { present: 5 }, young: { present: 8 } }]),
    ),
  });

  await expect(page.getByLabel("부서별 보고").getByLabel("출석").first()).toBeVisible();
});
```

- [x] **Step 4: Run the full verification suite**

Run: `npm run verify`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Projects/ministry-report-v2/tests/smoke/report-v2.spec.ts
git commit -m "test: cover attendance card editor"
```

## Task 6: Validate Spec Coverage And Finalize

**Files:**
- Modify: `Projects/ministry-report-v2/docs/superpowers/plans/2026-05-07-attendance-card-editor.md`

- [x] **Step 1: Verify spec coverage inline**

Check:
- fixed church name
- elementary seeded names
- all departments card editor
- add-member flow
- legacy numeric fallback
- import/export compatibility

Expected: every item maps to Tasks 1-5.

- [x] **Step 2: Run final project verification**

Run: `npm run verify`
Expected: PASS with updated smoke count.

- [x] **Step 3: Commit final planning note if updated**

```bash
git add Projects/ministry-report-v2/docs/superpowers/plans/2026-05-07-attendance-card-editor.md
git commit -m "docs: finalize attendance card editor plan"
```
