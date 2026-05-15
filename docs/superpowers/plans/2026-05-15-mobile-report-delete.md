# Mobile Report Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 최고관리자 계정에서 모바일 보고서 목록의 편집 모드를 통해 저장된 보고서를 삭제할 수 있게 한다.

**Architecture:** `MobileReportList`에 `canDelete`/`onDelete` prop을 추가하고, 편집 모드 토글(isEditing state)을 통해 각 카드에 삭제 버튼을 노출한다. App.tsx에서 `isSuperAdmin(currentAccount)`를 `canDelete`로 전달하고 기존 `handleDeleteReport`를 `onDelete`로 연결한다. 새 삭제 API 불필요 — 기존 Firestore 삭제 핸들러 재사용.

**Tech Stack:** React 19, TypeScript, Vitest

---

## 파일 구조

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/features/report/MobileReportList.tsx` | 수정 | `canDelete`, `onDelete` prop 추가; `isEditing` state; 편집/완료 버튼; 카드에 삭제 버튼 |
| `src/App.tsx` | 수정 | `canDelete={isSuperAdmin(currentAccount)}`, `onDelete={handleDeleteReport}` 전달 |

---

## Task 1: MobileReportList — canDelete/onDelete prop + 편집 모드 UI

**Files:**
- Modify: `src/features/report/MobileReportList.tsx`

현재 파일 전체 내용 (참고용):
```tsx
import type { AppMode } from "../mode/useAppMode";
import type { MinistryReport } from "../../domain/reportTypes";

type MobileReportListProps = {
  reports: MinistryReport[];
  appMode: AppMode;
  onSelectReport: (report: MinistryReport) => void;
  onNewReport: () => void;
  canCreateReport: boolean;
};
// ... (formatDate, deptSummary, DEPT_LABELS 생략)
export function MobileReportList({ reports, appMode, onSelectReport, onNewReport, canCreateReport }: MobileReportListProps) { ... }
```

- [ ] **Step 1: 파일 전체를 아래 코드로 교체**

```tsx
import { useState } from "react";
import type { AppMode } from "../mode/useAppMode";
import type { MinistryReport } from "../../domain/reportTypes";

type MobileReportListProps = {
  reports: MinistryReport[];
  appMode: AppMode;
  onSelectReport: (report: MinistryReport) => void;
  onNewReport: () => void;
  canCreateReport: boolean;
  canDelete?: boolean;
  onDelete?: (report: MinistryReport) => void;
};

const DEPT_LABELS: { key: "elementary" | "middleHigh" | "youngAdult" | "adult"; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${year}년 ${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

function deptSummary(report: MinistryReport): string {
  return DEPT_LABELS
    .filter(({ key }) => report.departments[key].attendance > 0)
    .map(({ key, label }) => `${label} ${report.departments[key].attendance}`)
    .join(" · ");
}

export function MobileReportList({
  reports,
  appMode,
  onSelectReport,
  onNewReport,
  canCreateReport,
  canDelete = false,
  onDelete,
}: MobileReportListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  function handleDeleteClick(report: MinistryReport) {
    const [year, month, day] = report.reportDate.split("-").map(Number);
    const confirmed = window.confirm(
      `${year}년 ${month}월 ${day}일 보고서를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (confirmed) {
      onDelete?.(report);
    }
  }

  return (
    <div className="mobile-report-list">
      {canCreateReport && (
        <button
          type="button"
          className="mobile-report-new-btn"
          onClick={onNewReport}
        >
          <span className="mobile-report-new-text">
            <span className="mobile-report-new-title">+ 새 보고서 작성</span>
            <span className="mobile-report-new-date">{todayStr}</span>
          </span>
          <span className="mobile-report-new-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </button>
      )}

      {reports.length > 0 && (
        <>
          <div className="mobile-report-section-header">
            <p className="mobile-report-section-label">
              {canCreateReport ? "저장된 보고서 — 탭하여 수정" : "이전 보고서"}
            </p>
            {canDelete && (
              <button
                type="button"
                className={`mobile-report-edit-toggle${isEditing ? " is-editing" : ""}`}
                onClick={() => setIsEditing((v) => !v)}
              >
                {isEditing ? "완료" : "편집"}
              </button>
            )}
          </div>
          <div className="mobile-report-card-list">
            {reports.map((r) => (
              <div key={r.id} className={`mobile-report-card-row${isEditing ? " is-editing" : ""}`}>
                {isEditing && (
                  <button
                    type="button"
                    className="mobile-report-delete-btn"
                    aria-label={`${r.reportDate} 보고서 삭제`}
                    onClick={() => handleDeleteClick(r)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-report-card"
                  onClick={() => !isEditing && onSelectReport(r)}
                  disabled={isEditing}
                >
                  <div className="mobile-report-card-body">
                    <span className="mobile-report-card-date">{formatDate(r.reportDate)}</span>
                    <span className="mobile-report-card-summary">{deptSummary(r)}</span>
                  </div>
                  {canCreateReport ? (
                    <span className="mobile-report-card-edit-badge" aria-hidden="true">수정</span>
                  ) : (
                    <span className="mobile-report-card-chevron" aria-hidden="true">›</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {reports.length === 0 && appMode === "viewer" && (
        <p className="mobile-report-empty">저장된 보고서가 없습니다</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 3: 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 4: 커밋**

```bash
git add src/features/report/MobileReportList.tsx
git commit -m "feat(mobile): add edit mode with delete button to MobileReportList"
```

---

## Task 2: App.tsx — canDelete/onDelete props 연결

**Files:**
- Modify: `src/App.tsx` (MobileReportList 사용 부분, 약 775~789줄)

현재 코드:
```tsx
<MobileReportList
  reports={reports}
  appMode={appMode}
  onSelectReport={(r) => {
    if (appMode === "reporter") {
      handleLoadReport(r);
    } else {
      const upgraded = upgradeReportForEditor(r);
      setReport(upgraded);
      setMobileScreen("editor");
    }
  }}
  onNewReport={handleNewReport}
  canCreateReport={permissions.canCreateReport && appMode !== "viewer"}
/>
```

- [ ] **Step 1: canDelete/onDelete prop 추가**

위 코드를 다음으로 교체:

```tsx
<MobileReportList
  reports={reports}
  appMode={appMode}
  onSelectReport={(r) => {
    if (appMode === "reporter") {
      handleLoadReport(r);
    } else {
      const upgraded = upgradeReportForEditor(r);
      setReport(upgraded);
      setMobileScreen("editor");
    }
  }}
  onNewReport={handleNewReport}
  canCreateReport={permissions.canCreateReport && appMode !== "viewer"}
  canDelete={isSuperAdmin(currentAccount)}
  onDelete={(r) => void handleDeleteReport(r)}
/>
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 3: 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx
git commit -m "feat(mobile): wire canDelete/onDelete to MobileReportList for superAdmin"
```

---

## Task 3: CSS — 편집 모드 스타일

**Files:**
- Modify: `src/styles.css` (파일 끝 UserManagementPanel 섹션 이후에 추가)

- [ ] **Step 1: CSS 추가**

`src/styles.css` 파일 끝에 다음을 추가:

```css
/* ── 모바일 보고서 목록 편집 모드 ── */
.mobile-report-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mobile-report-section-header .mobile-report-section-label {
  margin: 0;
}

.mobile-report-edit-toggle {
  background: none;
  border: 1.5px solid var(--clr-primary);
  border-radius: 8px;
  color: var(--clr-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 14px;
  transition: background 0.15s, color 0.15s;
}

.mobile-report-edit-toggle.is-editing {
  background: var(--clr-primary);
  color: #fff;
}

.mobile-report-card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mobile-report-card-row .mobile-report-card {
  flex: 1;
  margin-bottom: 0;
}

.mobile-report-card-row.is-editing .mobile-report-card {
  opacity: 0.7;
  cursor: default;
}

.mobile-report-delete-btn {
  background: #e53e3e;
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  transition: background 0.15s;
}

.mobile-report-delete-btn:active {
  background: #c53030;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 3: 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 4: 커밋 + push**

```bash
git add src/styles.css
git commit -m "feat(mobile): add edit mode delete button styles"
git push origin main
```

---

## 자체 검토

**스펙 커버리지:**
- ✅ canDelete — 최고관리자만 (`isSuperAdmin`) Task 2
- ✅ 편집/완료 토글 버튼 Task 1
- ✅ 각 카드 좌측 삭제 버튼 Task 1
- ✅ confirm 다이얼로그 Task 1
- ✅ onDelete 연결 Task 2
- ✅ CSS 스타일 Task 3

**Placeholder 없음:** 모든 코드 완성.

**타입 일관성:**
- `canDelete?: boolean` (optional, default false) — Task 1, 2 일치
- `onDelete?: (report: MinistryReport) => void` — Task 1, 2 일치
- `handleDeleteReport` 기존 시그니처 `(report: MinistryReport) => Promise<void>` — `void handleDeleteReport(r)` 래핑으로 맞춤
