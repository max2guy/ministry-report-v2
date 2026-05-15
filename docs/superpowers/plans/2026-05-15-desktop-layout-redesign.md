# Desktop Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크탑 UI를 CSS Grid 3단 레이아웃(좌측 사이드바 + 중앙 편집폼 + 하단 패널)으로 재구성한다.

**Architecture:** CSS Grid `grid-template-areas`로 220px 사이드바(네비+계정) / 중앙 스크롤 영역 / 220px 고정 하단 패널(보고서 목록 + 통계)을 구성한다. 기존 상단 헤더는 데스크탑에서 숨기고, 사이드바가 모든 네비게이션을 담당한다. 모바일 레이아웃은 변경 없다.

**Tech Stack:** React 19, TypeScript, CSS Grid, Vitest

---

## 파일 구조

| 파일 | 변경 유형 | 내용 |
|------|---------|------|
| `src/features/nav/DesktopSidebar.tsx` | 신규 | 좌측 사이드바 (앱 타이틀, 계정, 네비, 액션, 유틸) |
| `src/features/report/DesktopBottomPanel.tsx` | 신규 | 하단 패널 (보고서 목록 50% + 통계 50%) |
| `src/features/report/ReportEditor.tsx` | 수정 | 사이드바 JSX 제거 — TabbedReportForm만 래핑 |
| `src/App.tsx` | 수정 | downloadReport 추가, mode 타입 확장, 데스크탑 레이아웃 교체 |
| `src/styles.css` | 수정 | desktop-layout Grid CSS, 사이드바/하단 패널 스타일, 헤더 숨김 |
| `package.json` | 수정 | 버전 2.5.2 → 2.5.3 |

---

## Task 1: DesktopSidebar 컴포넌트 신규 생성

**Files:**
- Create: `src/features/nav/DesktopSidebar.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/features/nav/DesktopSidebar.tsx
import type { Account } from "../../auth/authTypes";
import { ThemeSelector } from "../theme/ThemeSelector";

export type DesktopMode = "edit" | "view" | "roster" | "settings";

type DesktopSidebarProps = {
  appVersion: string;
  currentAccount: Account | null | undefined;
  mode: DesktopMode;
  onModeChange: (mode: DesktopMode) => void;
  onSignOut: () => void;
  onNewReport: () => void;
  canSave: boolean;
  onSave: () => void;
  onExport: () => void;
  installState: "idle" | "ready" | "installed";
  onInstall: () => void;
  onForceRefresh: () => void;
};

const NAV_ITEMS: { key: DesktopMode; label: string }[] = [
  { key: "edit",     label: "보고서" },
  { key: "view",     label: "뷰어" },
  { key: "roster",   label: "명단" },
  { key: "settings", label: "설정" },
];

export function DesktopSidebar({
  appVersion,
  currentAccount,
  mode,
  onModeChange,
  onSignOut,
  onNewReport,
  canSave,
  onSave,
  onExport,
  installState,
  onInstall,
  onForceRefresh,
}: DesktopSidebarProps) {
  return (
    <nav className="desktop-sidebar" aria-label="사이드바 네비게이션">
      {/* 앱 타이틀 */}
      <div className="desktop-sidebar-header">
        <span className="desktop-sidebar-title">사역보고서</span>
        <span className="desktop-sidebar-version">v{appVersion}</span>
      </div>

      {/* 계정 */}
      {currentAccount && (
        <div className="desktop-sidebar-account">
          <div className="desktop-sidebar-avatar">
            {currentAccount.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="desktop-sidebar-account-info">
            <strong className="desktop-sidebar-account-name">
              {currentAccount.displayName}
            </strong>
            <span className="desktop-sidebar-account-email">
              {currentAccount.email}
            </span>
          </div>
          <button
            type="button"
            className="desktop-sidebar-signout"
            onClick={onSignOut}
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="desktop-sidebar-nav" role="tablist">
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            className={`desktop-nav-item${mode === key ? " is-active" : ""}`}
            onClick={() => onModeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 액션 버튼 (편집 모드일 때만) */}
      {mode === "edit" && (
        <div className="desktop-sidebar-actions">
          <button
            type="button"
            className="desktop-action-btn"
            onClick={onNewReport}
          >
            새 보고서
          </button>
          <button
            type="button"
            className="desktop-action-btn desktop-action-btn-primary"
            disabled={!canSave}
            onClick={onSave}
          >
            저장
          </button>
          <button
            type="button"
            className="desktop-action-btn desktop-action-btn-secondary"
            onClick={onExport}
          >
            내보내기
          </button>
        </div>
      )}

      {/* 하단 유틸리티 */}
      <div className="desktop-sidebar-utils">
        <ThemeSelector />
        <button
          type="button"
          className="desktop-util-btn"
          onClick={onForceRefresh}
          title="강제 새로고침 (캐시 초기화)"
          aria-label="강제 새로고침"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </button>
        {installState === "ready" && (
          <button
            type="button"
            className="desktop-util-btn"
            onClick={onInstall}
            aria-label="앱 설치"
          >
            📲 설치
          </button>
        )}
        {installState === "installed" && (
          <span className="pwa-installed-badge">✓ 설치됨</span>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: 오류 없이 빌드 완료 (DesktopSidebar는 아직 App.tsx에서 사용 안 함)

- [ ] **Step 3: 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 4: 커밋**

```bash
git add src/features/nav/DesktopSidebar.tsx
git commit -m "feat(desktop): add DesktopSidebar component"
```

---

## Task 2: DesktopBottomPanel 컴포넌트 신규 생성

**Files:**
- Create: `src/features/report/DesktopBottomPanel.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/features/report/DesktopBottomPanel.tsx
import type { MinistryReport } from "../../domain/reportTypes";
import { AttendanceSummaryStats } from "./AttendanceSummaryStats";
import { ReportHistoryPanel } from "./ReportHistoryPanel";

type DesktopBottomPanelProps = {
  reports: MinistryReport[];
  currentReportId: string;
  currentYear: number;
  onDelete: (report: MinistryReport) => void;
  onDuplicate: (report: MinistryReport) => void;
  onLoad: (report: MinistryReport) => void;
};

export function DesktopBottomPanel({
  reports,
  currentReportId,
  currentYear,
  onDelete,
  onDuplicate,
  onLoad,
}: DesktopBottomPanelProps) {
  return (
    <div className="desktop-bottom-panel">
      <div className="desktop-bottom-left">
        <ReportHistoryPanel
          reports={reports}
          currentReportId={currentReportId}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onLoad={onLoad}
        />
      </div>
      <div className="desktop-bottom-right">
        <AttendanceSummaryStats reports={reports} currentYear={currentYear} />
      </div>
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
git add src/features/report/DesktopBottomPanel.tsx
git commit -m "feat(desktop): add DesktopBottomPanel component"
```

---

## Task 3: ReportEditor 단순화 — 사이드바 JSX 제거

**Files:**
- Modify: `src/features/report/ReportEditor.tsx`

현재 ReportEditor는 `<aside className="edit-panel">` (계정패널, 버튼들, 히스토리패널 등)과 `<div className="editor-workspace">` (TabbedReportForm)으로 구성돼 있다. 사이드바 역할 전부가 DesktopSidebar + DesktopBottomPanel로 이동하므로, ReportEditor는 TabbedReportForm만 래핑하는 얇은 컴포넌트로 단순화한다.

- [ ] **Step 1: 파일 전체를 아래 코드로 교체**

```tsx
// src/features/report/ReportEditor.tsx
import type { DepartmentKey, MinistryReport } from "../../domain/reportTypes";
import { TabbedReportForm } from "./TabbedReportForm";

type ReportEditorProps = {
  report: MinistryReport;
  reports: MinistryReport[];
  onChange: (report: MinistryReport) => void;
  editableDepts: DepartmentKey[] | "all";
};

export function ReportEditor({
  report,
  reports,
  onChange,
  editableDepts,
}: ReportEditorProps) {
  return (
    <TabbedReportForm
      report={report}
      reports={reports}
      onChange={onChange}
      editableDepts={editableDepts}
    />
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
```

Expected: 오류 없이 빌드 완료 (App.tsx가 아직 기존 props로 ReportEditor를 호출하므로 타입 오류 발생 — Task 4에서 해결)

실제로는 Task 4와 함께 빌드해야 한다. 이 Task에서는 TypeScript 오류가 예상되므로 빌드 대신 타입체크만 확인:

```bash
npx tsc --noEmit 2>&1 | grep "ReportEditor" | head -10
```

Expected: ReportEditor 관련 오류가 App.tsx에서 나타남 (정상 — Task 4에서 수정)

- [ ] **Step 3: 커밋 (Task 4와 함께)**

ReportEditor 변경은 App.tsx 변경과 함께 커밋한다 — Task 4 Step 4에서 처리.

---

## Task 4: App.tsx — 데스크탑 레이아웃 교체

**Files:**
- Modify: `src/App.tsx`

현재 App.tsx 기준 주요 변경:
1. `DesktopSidebar`, `DesktopBottomPanel` import 추가
2. `downloadReport` 함수 App.tsx로 이동 (ReportEditor에서 제거됨)
3. `mode` state 타입을 `DesktopMode`로 변경
4. `.desktop-only` 블록을 `.desktop-layout` Grid 구조로 교체
5. settings 모드 추가

- [ ] **Step 1: import 추가**

`src/App.tsx` 상단 import 목록에 아래 두 줄 추가:

```tsx
import { DesktopSidebar, type DesktopMode } from "./features/nav/DesktopSidebar";
import { DesktopBottomPanel } from "./features/report/DesktopBottomPanel";
```

기존 `import { ReportHistoryPanel }` 줄은 삭제 (DesktopBottomPanel 내부에서 사용).

- [ ] **Step 2: downloadReport 함수 추가**

`src/App.tsx`에서 `handleForceRefresh` 함수(약 563줄) 바로 아래에 추가:

```tsx
function downloadReport(targetReport: MinistryReport) {
  const blob = new Blob([JSON.stringify(targetReport, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${targetReport.reportDate}-ministry-report-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: mode state 타입 변경 (177줄)**

```tsx
// 변경 전
const [mode, setMode] = useState<"edit" | "view" | "roster">("edit");

// 변경 후
const [mode, setMode] = useState<DesktopMode>("edit");
```

- [ ] **Step 4: 데스크탑 블록 교체**

기존 (약 858~915줄):
```tsx
{/* Desktop-only: existing layout unchanged */}
<div className="desktop-only">
  {mode === "edit" ? (
    <ReportEditor
      report={report}
      reports={reports}
      accountPanel={...}
      canSave={!!currentAccount}
      importPanel={...}
      historyPanel={...}
      githubPanel={...}
      onChange={handleReportChange}
      onNewReport={handleNewReport}
      onSave={handleSave}
      saveErrors={saveErrors}
      saveStatus={saveStatus}
      saveDisabledReason="로그인 후 저장할 수 있습니다."
      editableDepts={permissions.editableDepts}
    />
  ) : mode === "roster" ? (
    <main className="roster-shell">
      {roster && (
        <MemberRosterTab roster={roster} onChange={handleRosterChange} visibleDepts={permissions.visibleDepts} />
      )}
    </main>
  ) : (
    <ReportViewer
      report={report}
      reports={reports}
      activeTabIdx={safeTabIdx}
      tabs={viewerTabs}
      onTabChange={setViewerTabIdx}
    />
  )}
</div>
```

위 블록 전체를 아래로 교체:

```tsx
{/* Desktop 3단 레이아웃 */}
<div className="desktop-layout desktop-only">
  <DesktopSidebar
    appVersion={__APP_VERSION__}
    currentAccount={currentAccount}
    mode={mode}
    onModeChange={setMode}
    onSignOut={() => void handleSignOut()}
    onNewReport={handleNewReport}
    canSave={!!currentAccount}
    onSave={() => void handleSave()}
    onExport={() => downloadReport(report)}
    installState={installState}
    onInstall={() => void triggerInstall()}
    onForceRefresh={() => void handleForceRefresh()}
  />
  <div className="desktop-center">
    {mode === "edit" && (
      <ReportEditor
        report={report}
        reports={reports}
        onChange={handleReportChange}
        editableDepts={permissions.editableDepts}
      />
    )}
    {mode === "view" && (
      <ReportViewer
        report={report}
        reports={reports}
        activeTabIdx={safeTabIdx}
        tabs={viewerTabs}
        onTabChange={setViewerTabIdx}
      />
    )}
    {mode === "roster" && (
      <main className="roster-shell">
        {roster && (
          <MemberRosterTab
            roster={roster}
            onChange={handleRosterChange}
            visibleDepts={permissions.visibleDepts}
          />
        )}
      </main>
    )}
    {mode === "settings" && (
      <div className="desktop-settings">
        <ReporterAccountPanel
          currentAccount={currentAccount}
          onSignOut={() => void handleSignOut()}
          onDisplayNameChange={handleDisplayNameChange}
        />
        <LegacyImportPanel
          warnings={importWarnings}
          onImport={handleImport}
          onImportError={handleImportError}
        />
        {(currentAccount?.role === "admin" || isSuperAdmin(currentAccount)) && (
          <GithubSettingsPanel />
        )}
      </div>
    )}
  </div>
  <DesktopBottomPanel
    reports={reports}
    currentReportId={report.id}
    currentYear={new Date().getFullYear()}
    onDelete={handleDeleteReport}
    onDuplicate={handleDuplicateReport}
    onLoad={handleLoadReport}
  />
</div>
```

- [ ] **Step 5: 빌드 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -8
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 6: 테스트 실행**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests 31 passed (31)`

- [ ] **Step 7: 커밋**

```bash
git add src/App.tsx src/features/report/ReportEditor.tsx
git commit -m "feat(desktop): wire 3-panel layout in App.tsx, simplify ReportEditor"
```

---

## Task 5: CSS — 데스크탑 Grid 레이아웃 + 사이드바 스타일

**Files:**
- Modify: `src/styles.css` (파일 끝에 추가)

- [ ] **Step 1: CSS 추가**

`src/styles.css` 파일 끝에 아래 블록 전체를 추가:

```css
/* ════════════════════════════════════════════════
   데스크탑 3단 레이아웃 (pointer: fine + 821px+)
   ════════════════════════════════════════════════ */

@media (min-width: 821px) and (pointer: fine) {
  /* 헤더 숨김 */
  .top-bar {
    display: none;
  }

  /* Grid 컨테이너 */
  .desktop-layout {
    display: grid;
    grid-template:
      "sidebar center" 1fr
      "sidebar bottom" 220px
      / 220px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* 중앙 편집 영역 */
  .desktop-center {
    grid-area: center;
    overflow-y: auto;
    padding: 24px 28px;
    background: var(--clr-bg);
  }

  /* 하단 패널 */
  .desktop-bottom-panel {
    grid-area: bottom;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--clr-border);
    background: var(--clr-card-bg);
    overflow: hidden;
  }

  .desktop-bottom-left,
  .desktop-bottom-right {
    overflow-y: auto;
    padding: 10px 16px;
  }

  .desktop-bottom-left {
    border-right: 1px solid var(--clr-border);
  }

  /* 설정 화면 */
  .desktop-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 640px;
  }
}

/* ── 데스크탑 사이드바 ── */
.desktop-sidebar {
  grid-area: sidebar;
  background: var(--clr-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 20px 14px 16px;
}

.desktop-sidebar-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-bottom: 14px;
}

.desktop-sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.desktop-sidebar-version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.desktop-sidebar-account {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  margin-bottom: 8px;
  text-align: center;
}

.desktop-sidebar-avatar {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.desktop-sidebar-account-name {
  display: block;
  font-size: 14px;
  color: #fff;
}

.desktop-sidebar-account-email {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  word-break: break-all;
}

.desktop-sidebar-signout {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 12px;
  margin-top: 2px;
  transition: background 0.15s;
}

.desktop-sidebar-signout:hover {
  background: rgba(255, 255, 255, 0.2);
}

.desktop-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.desktop-nav-item {
  background: none;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 12px;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.desktop-nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.desktop-nav-item.is-active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 600;
}

.desktop-sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.desktop-action-btn {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 12px;
  text-align: left;
  transition: background 0.15s;
  width: 100%;
}

.desktop-action-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.desktop-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.desktop-action-btn-primary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--clr-primary);
  font-weight: 700;
}

.desktop-action-btn-primary:hover:not(:disabled) {
  background: #fff;
}

.desktop-action-btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.desktop-sidebar-utils {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.desktop-util-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  transition: background 0.15s;
}

.desktop-util-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
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
git add src/styles.css
git commit -m "feat(desktop): add CSS Grid 3-panel layout and sidebar styles"
```

---

## Task 6: 버전 bump + push

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 버전 변경**

`package.json` 4번째 줄:
```json
"version": "2.5.2"
```
→
```json
"version": "2.5.3"
```

- [ ] **Step 2: 빌드 + 테스트 최종 확인**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm run build 2>&1 | tail -5
npm test 2>&1 | tail -5
```

Expected:
- 빌드: 오류 없이 완료
- 테스트: `Tests 31 passed (31)`

- [ ] **Step 3: 커밋 + push**

```bash
git add package.json
git commit -m "chore: bump version to 2.5.3"
git push origin main
```

---

## 자체 검토

**스펙 커버리지:**
- ✅ CSS Grid 3단 레이아웃 (`desktop-layout`) — Task 5
- ✅ 좌측 사이드바 220px — Task 1, 5
- ✅ 앱 타이틀 + 버전 — Task 1
- ✅ 계정 아바타 + 이름 (타이틀 아래) — Task 1
- ✅ 로그아웃 버튼 — Task 1
- ✅ 네비게이션 (보고서/뷰어/명단/설정) — Task 1, 4
- ✅ 액션 버튼 (새 보고서/저장/내보내기, 편집 모드만) — Task 1, 4
- ✅ 상단 헤더 숨김 (데스크탑) — Task 5
- ✅ 중앙 편집폼 — Task 3, 4
- ✅ 하단 패널 고정 220px — Task 2, 5
- ✅ 하단 좌측: 보고서 목록 — Task 2
- ✅ 하단 우측: 통계 — Task 2
- ✅ 설정 모드 (계정/불러오기/GitHub) — Task 4
- ✅ 모바일 레이아웃 변경 없음 — `.desktop-only` 클래스 유지

**Placeholder 없음** ✅

**타입 일관성:**
- `DesktopMode = "edit" | "view" | "roster" | "settings"` — Task 1에서 정의, Task 4에서 사용 ✅
- `DesktopBottomPanel.onDelete: (report: MinistryReport) => void` — `handleDeleteReport` (async) 할당 가능 ✅
- `DesktopSidebar.currentAccount: Account | null | undefined` — App.tsx의 `currentAccount` 타입과 일치 ✅
