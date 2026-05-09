import { useEffect, useState } from "react";
import type { Account } from "./auth/authTypes";
import { listAccounts } from "./auth/internalAuthStore";
import { ThemeSelector } from "./features/theme/ThemeSelector";
import { applyTheme, getStoredTheme } from "./features/theme/useTheme";
import { createDefaultRoster, mergeRosterFromReport, type MemberRoster } from "./domain/memberRoster";
import {
  cloneReportAsDraft,
  createEmptyReport,
  type MinistryReport,
  upgradeReportForEditor,
} from "./domain/reportTypes";
import { validateReportForSave } from "./domain/reportValidation";
import { useInstallPrompt } from "./features/pwa/useInstallPrompt";
import { AdminRecoveryManager } from "./features/admin/AdminRecoveryManager";
import { AuthGate } from "./features/auth/AuthGate";
import { ReporterAccountPanel } from "./features/auth/ReporterAccountPanel";
import { LegacyImportPanel } from "./features/import/LegacyImportPanel";
import { ReportEditor } from "./features/report/ReportEditor";
import { ReportHistoryPanel } from "./features/report/ReportHistoryPanel";
import { ReportViewer } from "./features/report/ReportViewer";
import { MemberRosterTab } from "./features/roster/MemberRosterTab";
import { readReportDraft, saveReportDraft } from "./storage/reportDraftStore";
import { loadRoster, saveRoster } from "./storage/memberRosterStore";
import {
  deleteReport,
  listReports,
  saveReport,
  saveReports,
} from "./storage/reportStore";

const CURRENT_ACCOUNT_ID_KEY = "ministry-report-v2-current-account-id";

/** roster 변경 시 현재 report의 members/zones를 동기화 (기존 출석 상태는 유지) */
function syncReportFromRoster(
  report: MinistryReport,
  roster: MemberRoster,
): MinistryReport {
  const departments = { ...report.departments };

  // 플랫 부서 (유초등부, 중고등부, 청년부) 동기화
  for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
    const rDept = roster.departments[key];
    if (rDept.kind !== "flat") continue;
    const rMembers = rDept.members;
    const existing = departments[key].members ?? [];
    const existingMap = new Map(existing.map((m) => [m.id, m]));
    const members = rMembers.map((rm) => {
      const existing = existingMap.get(rm.id);
      return existing
        ? { ...existing, id: rm.id, name: rm.name, group: rm.group }
        : { id: rm.id, name: rm.name, status: "absent" as const, group: rm.group };
    });
    departments[key] = { ...departments[key], members };
  }

  // 장년 구역 동기화
  const rAdult = roster.departments.adult;
  if (rAdult.kind === "zoned") {
    const existingZones = departments.adult.zones ?? [];
    // ID로 먼저 매칭, 없으면 이름으로 매칭
    const existingById = new Map(existingZones.map((z) => [z.id, z]));
    const existingByName = new Map(existingZones.map((z) => [z.name, z]));
    const zones = rAdult.zones.map((rz) => {
      const existingZone = existingById.get(rz.id) ?? existingByName.get(rz.name);
      // 멤버도 ID 우선, 없으면 이름으로 매칭
      const existingMemberById = new Map((existingZone?.members ?? []).map((m) => [m.id, m]));
      const existingMemberByName = new Map((existingZone?.members ?? []).map((m) => [m.name, m]));
      const members = rz.members.map((rm) => {
        const existing = existingMemberById.get(rm.id) ?? existingMemberByName.get(rm.name);
        return existing
          ? { ...existing, id: rm.id, name: rm.name }
          : { id: rm.id, name: rm.name, status: "absent" as const };
      });
      return { id: rz.id, name: rz.name, district: rz.district, members };
    });
    const attendance = zones.reduce(
      (sum, z) => sum + z.members.filter((m) => m.status === "present").length,
      0,
    );
    departments.adult = { ...departments.adult, zones, attendance };
  }

  return { ...report, departments, updatedAt: new Date().toISOString() };
}

function latestReport(reports: MinistryReport[]): MinistryReport | undefined {
  return sortReports(reports)[0];
}

function sortReports(reports: MinistryReport[]): MinistryReport[] {
  return reports.slice().sort((a, b) => {
    const dateOrder = b.reportDate.localeCompare(a.reportDate);
    return dateOrder || b.updatedAt.localeCompare(a.updatedAt);
  });
}

function mergeReports(
  currentReports: MinistryReport[],
  nextReports: MinistryReport[],
): MinistryReport[] {
  const byId = new Map(currentReports.map((item) => [item.id, item]));
  nextReports.forEach((item) => byId.set(item.id, item));
  return sortReports([...byId.values()]);
}

function reportWithAccount(
  report: MinistryReport,
  account: Account,
): MinistryReport {
  return {
    ...report,
    pastorName: account.displayName,
    updatedAt: new Date().toISOString(),
  };
}

function canAccountSave(account?: Account): boolean {
  return account?.status === "active";
}

function saveDisabledReason(account?: Account): string {
  return account
    ? "비밀번호를 먼저 변경해 주세요."
    : "보고자 계정을 먼저 생성해 주세요.";
}

export function App() {
  // 저장된 테마 즉시 적용
  useEffect(() => { applyTheme(getStoredTheme()); }, []);

  const { state: installState, triggerInstall } = useInstallPrompt();

  const [mode, setMode] = useState<"edit" | "view" | "roster">("edit");
  const [roster, setRoster] = useState<MemberRoster | undefined>();
  const [report, setReport] = useState(() => createEmptyReport());
  const [reports, setReports] = useState<MinistryReport[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialState() {
      const [storedReports, storedAccounts] = await Promise.all([
        listReports(),
        listAccounts(),
      ]);

      const draft = readReportDraft();
      const latest = latestReport(storedReports);
      const accountId = localStorage.getItem(CURRENT_ACCOUNT_ID_KEY);
      const storedAccount = storedAccounts.find(
        (account) => account.id === accountId,
      );

      let storedRoster = storedAccount
        ? await loadRoster(storedAccount.email)
        : undefined;

      // 저장된 roster가 없으면 기본값 생성 후 즉시 저장 (UUID 고정)
      if (!storedRoster && storedAccount) {
        storedRoster = createDefaultRoster();
        await saveRoster(storedAccount.email, storedRoster);
      }

      if (!isMounted) return;

      setReports(sortReports(storedReports));
      setAccounts(storedAccounts);
      if (storedAccount) setCurrentAccount(storedAccount);
      if (storedRoster) setRoster(storedRoster);
      const initialReport = draft ?? latest;
      if (initialReport) {
        const upgradedReport = upgradeReportForEditor(initialReport);
        setReport(
          storedAccount && !upgradedReport.pastorName
            ? reportWithAccount(upgradedReport, storedAccount)
            : upgradedReport,
        );
      }
      setIsHydrated(true);
    }

    void loadInitialState();

    return () => {
      isMounted = false;
    };
  }, []);

  function setActiveAccount(account: Account) {
    localStorage.setItem(CURRENT_ACCOUNT_ID_KEY, account.id);
    setCurrentAccount(account);
    setReport((currentReport) => {
      const nextReport = reportWithAccount(currentReport, account);
      saveReportDraft(nextReport);
      return nextReport;
    });
  }

  function handleAccountCreated(account: Account) {
    setAccounts((currentAccounts) => [...currentAccounts, account]);
    setActiveAccount(account);
    setSaveStatus(`${account.displayName} 계정이 준비되었습니다.`);
  }

  function handleAccountSignedIn(account: Account) {
    setActiveAccount(account);
    setSaveStatus(`${account.displayName} 계정으로 로그인되었습니다.`);
  }

  function handleSignOut() {
    localStorage.removeItem(CURRENT_ACCOUNT_ID_KEY);
    setCurrentAccount(undefined);
    setSaveStatus("로그아웃되었습니다.");
    setMode("edit");
  }

  function replaceAccount(account: Account) {
    setAccounts((currentAccounts) =>
      currentAccounts.map((item) => (item.id === account.id ? account : item)),
    );
    if (currentAccount?.id === account.id) setCurrentAccount(account);
  }

  function handleReportChange(nextReport: MinistryReport) {
    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(nextReport);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);

    // Report → Roster 완전 양방향 동기화 (추가·삭제·그룹 변경)
    setRoster(prev => {
      if (!prev) return prev;
      let nextDepts = { ...prev.departments };
      let changed = false;

      for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
        const rDept = prev.departments[key];
        if (rDept.kind !== "flat") continue;

        const reportMembers = upgradedReport.departments[key].members ?? [];
        const reportById    = new Map(reportMembers.map(m => [m.id, m]));
        const rosterById    = new Map(rDept.members.map(m => [m.id, m]));

        const toAdd     = reportMembers.filter(m => !rosterById.has(m.id));
        const removeIds = new Set(rDept.members.filter(m => !reportById.has(m.id)).map(m => m.id));

        let rosterMembers = rDept.members
          .filter(m => !removeIds.has(m.id))
          .map(m => {
            const rm = reportById.get(m.id);
            return rm && rm.group !== m.group ? { ...m, group: rm.group } : m;
          });

        for (const m of toAdd) {
          rosterMembers = [...rosterMembers, { id: m.id, name: m.name, ...(m.group ? { group: m.group } : {}) }];
        }

        if (toAdd.length > 0 || removeIds.size > 0 ||
            rDept.members.some(m => { const rm = reportById.get(m.id); return rm && rm.group !== m.group; })) {
          nextDepts = { ...nextDepts, [key]: { kind: "flat", members: rosterMembers } };
          changed = true;
        }
      }

      // adult 구역 동기화 (추가·삭제·구역 간 이동)
      const reportAdult = upgradedReport.departments.adult;
      const rAdult = prev.departments.adult;
      if (rAdult.kind === "zoned" && reportAdult.zones) {
        const rosterZoneById = new Map(rAdult.zones.map(z => [z.id, z]));
        let adultChanged = false;
        const newRosterZones = reportAdult.zones.map(reportZone => {
          const rosterZone = rosterZoneById.get(reportZone.id);
          const rosterMemberById = new Map((rosterZone?.members ?? []).map(m => [m.id, m]));
          const newMembers = reportZone.members.map(rm =>
            rosterMemberById.get(rm.id) ?? { id: rm.id, name: rm.name },
          );
          const oldIds = (rosterZone?.members ?? []).map(m => m.id).join(",");
          const newIds = newMembers.map(m => m.id).join(",");
          if (oldIds !== newIds) adultChanged = true;
          return { ...(rosterZone ?? { id: reportZone.id, name: reportZone.name, district: reportZone.district }), members: newMembers };
        });
        if (adultChanged) {
          nextDepts = { ...nextDepts, adult: { kind: "zoned", zones: newRosterZones } };
          changed = true;
        }
      }

      if (!changed) return prev;
      const nextRoster: MemberRoster = { ...prev, departments: nextDepts, updatedAt: new Date().toISOString() };
      if (currentAccount) void saveRoster(currentAccount.email, nextRoster);
      return nextRoster;
    });
  }

  async function handleSave() {
    if (!currentAccount) {
      setSaveErrors([]);
      setSaveStatus("보고자 계정을 먼저 생성해 주세요.");
      return;
    }

    if (!canAccountSave(currentAccount)) {
      setSaveErrors([]);
      setSaveStatus("비밀번호를 먼저 변경해 주세요.");
      return;
    }

    const reportToSave = reportWithAccount(report, currentAccount);
    const validationErrors = validateReportForSave(reportToSave);

    if (validationErrors.length) {
      setSaveErrors(validationErrors);
      setSaveStatus(validationErrors[0]);
      return;
    }

    await saveReport(reportToSave);
    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(reportToSave);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);
    setReports((currentReports) => mergeReports(currentReports, [upgradedReport]));
    setSaveStatus(`${currentAccount.displayName} 계정으로 저장되었습니다.`);
  }

  function handleNewReport() {
    const nextReport = createEmptyReport(new Date(), roster);
    const draft = currentAccount
      ? reportWithAccount(nextReport, currentAccount)
      : nextReport;
    setReport(draft);
    saveReportDraft(draft);
    setSaveErrors([]);
    setSaveStatus("새 보고서를 만들었습니다.");
  }

  function handleRosterChange(nextRoster: MemberRoster) {
    setRoster(nextRoster);
    if (currentAccount) {
      void saveRoster(currentAccount.email, nextRoster);
    }
    // roster 변경 시 현재 report의 zones/members도 동기화
    setReport((currentReport) => {
      const next = syncReportFromRoster(currentReport, nextRoster);
      saveReportDraft(next);
      return next;
    });
  }

  function handleLoadReport(storedReport: MinistryReport) {
    const upgradedReport = upgradeReportForEditor(storedReport);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);
    setSaveErrors([]);
    setSaveStatus(`${storedReport.reportDate} 보고서를 불러왔습니다.`);
  }

  function handleDuplicateReport(storedReport: MinistryReport) {
    const duplicate = cloneReportAsDraft(storedReport);
    const draft = currentAccount
      ? reportWithAccount(duplicate, currentAccount)
      : duplicate;

    setReport(draft);
    saveReportDraft(draft);
    setSaveErrors([]);
    setSaveStatus(
      `${storedReport.reportDate} 보고서를 복사해 새 보고서를 만들었습니다.`,
    );
  }

  async function handleDeleteReport(storedReport: MinistryReport) {
    await deleteReport(storedReport.id);
    const nextReports = reports.filter((item) => item.id !== storedReport.id);
    const nextReport = upgradeReportForEditor(
      latestReport(nextReports) ?? createEmptyReport(),
    );

    setReports(nextReports);
    if (report.id === storedReport.id) {
      setReport(nextReport);
      saveReportDraft(nextReport);
    }
    setSaveStatus(`${storedReport.reportDate} 보고서를 삭제했습니다.`);
  }

  async function handleImport(
    importedReports: MinistryReport[],
    warnings: string[],
  ) {
    setImportWarnings(warnings);

    if (!importedReports.length) {
      setSaveStatus("가져올 보고서가 없습니다.");
      return;
    }

    await saveReports(importedReports);

    // 가장 최신 보고서의 members/zones로 roster 동기화
    const latest = latestReport(importedReports);
    if (latest) {
      const upgradedReport = upgradeReportForEditor(latest);
      setReport(upgradedReport);
      saveReportDraft(upgradedReport);

      // roster 업데이트: 기존 roster에 병합 (phone 등 추가 정보 보존)
      setRoster((prev) => {
        const nextRoster = mergeRosterFromReport(prev, latest);
        if (currentAccount) void saveRoster(currentAccount.email, nextRoster);
        return nextRoster;
      });
    }

    setReports((currentReports) =>
      mergeReports(currentReports, importedReports),
    );
    setSaveStatus(
      warnings.length
        ? `${importedReports.length}개 보고서를 가져왔습니다. ${warnings.length}개 경고가 있습니다.`
        : `${importedReports.length}개 보고서를 가져왔습니다. 명단도 업데이트되었습니다.`,
    );
  }

  function handleImportError(message: string) {
    setImportWarnings([]);
    setSaveErrors([]);
    setSaveStatus(message);
  }

  async function handleForceRefresh() {
    // 1) SW 전부 해제
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    // 2) 모든 캐시 삭제
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    // 3) 강제 새로고침
    window.location.reload();
  }

  if (!isHydrated) {
    return <main className="app-shell" />;
  }

  if (!currentAccount) {
    return (
      <main className="app-shell auth-shell">
        <AuthGate
          onCreated={handleAccountCreated}
          onSignedIn={handleAccountSignedIn}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="top-bar-title-row">
          <h1>사역보고서 v2</h1>
          {installState === "ready" && (
            <button
              type="button"
              className="btn-pwa-install"
              onClick={() => void triggerInstall()}
              aria-label="앱 설치"
            >
              📲 설치
            </button>
          )}
          {installState === "installed" && (
            <span className="pwa-installed-badge" aria-label="앱 설치됨">✓ 설치됨</span>
          )}
          <button
            type="button"
            className="btn-force-refresh"
            onClick={() => void handleForceRefresh()}
            title="앱 강제 새로고침 (캐시 초기화)"
            aria-label="강제 새로고침"
          >
            🔄
          </button>
        </div>
        <ThemeSelector />
        <div className="segmented-control" aria-label="보기 모드">
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            보고서
          </button>
          <button
            type="button"
            aria-pressed={mode === "view"}
            onClick={() => setMode("view")}
          >
            뷰어
          </button>
          <button
            type="button"
            aria-pressed={mode === "roster"}
            onClick={() => setMode("roster")}
          >
            명단관리
          </button>
        </div>
      </header>
      {mode === "edit" ? (
        <ReportEditor
          report={report}
          reports={reports}
          accountPanel={
            <>
              <ReporterAccountPanel
                currentAccount={currentAccount}
                onAccountChanged={replaceAccount}
                onSignOut={handleSignOut}
              />
              <AdminRecoveryManager
                accounts={accounts}
                onRecovered={replaceAccount}
              />
            </>
          }
          canSave={canAccountSave(currentAccount)}
          importPanel={
            <LegacyImportPanel
              warnings={importWarnings}
              onImport={handleImport}
              onImportError={handleImportError}
            />
          }
          historyPanel={
            <ReportHistoryPanel
              reports={reports}
              currentReportId={report.id}
              onDelete={handleDeleteReport}
              onDuplicate={handleDuplicateReport}
              onLoad={handleLoadReport}
            />
          }
          onChange={handleReportChange}
          onNewReport={handleNewReport}
          onSave={handleSave}
          saveErrors={saveErrors}
          saveStatus={saveStatus}
          saveDisabledReason={saveDisabledReason(currentAccount)}
        />
      ) : mode === "roster" ? (
        <main className="roster-shell">
          {roster && (
            <MemberRosterTab
              roster={roster}
              onChange={handleRosterChange}
            />
          )}
        </main>
      ) : (
        <ReportViewer report={report} reports={reports} />
      )}
    </main>
  );
}
