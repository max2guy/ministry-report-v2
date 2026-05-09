import { useEffect, useState } from "react";
import type { Account } from "./auth/authTypes";
import { onAuthChange, signOut as firebaseSignOut } from "./auth/firebaseAuthStore";
import { ThemeSelector } from "./features/theme/ThemeSelector";
import { applyTheme, getStoredTheme } from "./features/theme/useTheme";
import {
  createDefaultRoster,
  mergeRosterFromReport,
  type MemberRoster,
} from "./domain/memberRoster";
import {
  cloneReportAsDraft,
  createEmptyReport,
  type MinistryReport,
  upgradeReportForEditor,
} from "./domain/reportTypes";
import { validateReportForSave } from "./domain/reportValidation";
import { useInstallPrompt } from "./features/pwa/useInstallPrompt";
import { AuthGate } from "./features/auth/AuthGate";
import { ReporterAccountPanel } from "./features/auth/ReporterAccountPanel";
import { LegacyImportPanel } from "./features/import/LegacyImportPanel";
import { ReportEditor } from "./features/report/ReportEditor";
import { ReportHistoryPanel } from "./features/report/ReportHistoryPanel";
import { ReportViewer } from "./features/report/ReportViewer";
import { MemberRosterTab } from "./features/roster/MemberRosterTab";
import { GithubSettingsPanel } from "./features/sync/GithubSettingsPanel";
import { uploadToGist } from "./features/sync/githubGistBackup";
import { readReportDraft, saveReportDraft } from "./storage/reportDraftStore";
import {
  firestoreListReports,
  firestoreSaveReport,
  firestoreSaveReports,
  firestoreDeleteReport,
} from "./storage/firestoreReportStore";
import {
  firestoreLoadRoster,
  firestoreSaveRoster,
} from "./storage/firestoreRosterStore";
import {
  listReports as localListReports,
  saveReport as localSaveReport,
  saveReports as localSaveReports,
} from "./storage/reportStore";
import { loadRoster as localLoadRoster } from "./storage/memberRosterStore";

/** roster 변경 시 현재 report의 members/zones를 동기화 */
function syncReportFromRoster(
  report: MinistryReport,
  roster: MemberRoster,
): MinistryReport {
  const departments = { ...report.departments };

  for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
    const rDept = roster.departments[key];
    if (rDept.kind !== "flat") continue;
    const rMembers = rDept.members;
    const existing = departments[key].members ?? [];
    const existingMap = new Map(existing.map((m) => [m.id, m]));
    const members = rMembers.map((rm) => {
      const ex = existingMap.get(rm.id);
      return ex
        ? { ...ex, id: rm.id, name: rm.name, group: rm.group }
        : { id: rm.id, name: rm.name, status: "absent" as const, group: rm.group };
    });
    departments[key] = { ...departments[key], members };
  }

  const rAdult = roster.departments.adult;
  if (rAdult.kind === "zoned") {
    const existingZones = departments.adult.zones ?? [];
    const existingById = new Map(existingZones.map((z) => [z.id, z]));
    const existingByName = new Map(existingZones.map((z) => [z.name, z]));
    const zones = rAdult.zones.map((rz) => {
      const existingZone = existingById.get(rz.id) ?? existingByName.get(rz.name);
      const existingMemberById = new Map(
        (existingZone?.members ?? []).map((m) => [m.id, m]),
      );
      const existingMemberByName = new Map(
        (existingZone?.members ?? []).map((m) => [m.name, m]),
      );
      const members = rz.members.map((rm) => {
        const ex =
          existingMemberById.get(rm.id) ?? existingMemberByName.get(rm.name);
        return ex
          ? { ...ex, id: rm.id, name: rm.name }
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

export function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  const { state: installState, triggerInstall } = useInstallPrompt();

  const [mode, setMode] = useState<"edit" | "view" | "roster">("edit");
  const [roster, setRoster] = useState<MemberRoster | undefined>();
  const [report, setReport] = useState(() => createEmptyReport());
  const [reports, setReports] = useState<MinistryReport[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [pendingMigrationReports, setPendingMigrationReports] = useState<
    MinistryReport[]
  >([]);
  const [pendingMigrationRoster, setPendingMigrationRoster] = useState<
    MemberRoster | undefined
  >();

  // Firebase Auth 상태 구독
  useEffect(() => {
    const unsubscribe = onAuthChange((account) => {
      if (!account) {
        setCurrentAccount(undefined);
        setIsHydrated(true);
        return;
      }
      setCurrentAccount(account);
      void loadCloudData(account);
    });
    return unsubscribe;
  }, []);

  async function loadCloudData(account: Account) {
    try {
      const [cloudReports, cloudRoster] = await Promise.all([
        firestoreListReports(),
        firestoreLoadRoster(),
      ]);

      const draft = readReportDraft();

      // 마이그레이션 확인: Firestore 비어있고 IndexedDB에 기존 데이터 있는 경우
      if (cloudReports.length === 0) {
        const localReports = await localListReports();
        if (localReports.length > 0) {
          const localRoster = await localLoadRoster(account.email);
          setPendingMigrationReports(localReports);
          setPendingMigrationRoster(localRoster);
          setShowMigrationDialog(true);

          const nextReport =
            draft ?? latestReport(localReports) ?? createEmptyReport();
          const upgraded = upgradeReportForEditor(nextReport);
          setReport(reportWithAccount(upgraded, account));
          setRoster(localRoster);
          setReports(sortReports(localReports));
          setIsHydrated(true);
          return;
        }
      }

      const storedRoster = cloudRoster ?? createDefaultRoster();
      const latest = latestReport(cloudReports);
      const initialReport = draft ?? latest;

      setReports(sortReports(cloudReports));
      setRoster(storedRoster);
      if (initialReport) {
        const upgraded = upgradeReportForEditor(initialReport);
        setReport(
          !upgraded.pastorName
            ? reportWithAccount(upgraded, account)
            : upgraded,
        );
      }
      setIsHydrated(true);
    } catch (err) {
      console.error("Failed to load cloud data:", err);
      setSaveStatus("데이터 로드 실패. 오프라인 상태일 수 있습니다.");
      setIsHydrated(true);
    }
  }

  async function handleMigrate() {
    await firestoreSaveReports(pendingMigrationReports);
    if (pendingMigrationRoster) {
      await firestoreSaveRoster(pendingMigrationRoster);
    }
    setShowMigrationDialog(false);
    setPendingMigrationReports([]);
    setPendingMigrationRoster(undefined);
    setSaveStatus(
      `${pendingMigrationReports.length}개 보고서를 클라우드로 이전했습니다.`,
    );
  }

  function handleMigrationSkip() {
    setShowMigrationDialog(false);
    setPendingMigrationReports([]);
    setPendingMigrationRoster(undefined);
  }

  function handleSignedIn(account: Account) {
    setCurrentAccount(account);
    setSaveStatus(`${account.displayName}으로 로그인되었습니다.`);
  }

  async function handleSignOut() {
    await firebaseSignOut();
    setCurrentAccount(undefined);
    setReports([]);
    setRoster(undefined);
    setReport(createEmptyReport());
    setSaveStatus("로그아웃되었습니다.");
    setMode("edit");
    setIsHydrated(true);
  }

  function handleReportChange(nextReport: MinistryReport) {
    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(nextReport);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);

    // Report → Roster 양방향 동기화
    setRoster((prev) => {
      if (!prev) return prev;
      let nextDepts = { ...prev.departments };
      let changed = false;

      for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
        const rDept = prev.departments[key];
        if (rDept.kind !== "flat") continue;

        const reportMembers = upgradedReport.departments[key].members ?? [];
        const reportById = new Map(reportMembers.map((m) => [m.id, m]));
        const rosterById = new Map(rDept.members.map((m) => [m.id, m]));

        const toAdd = reportMembers.filter((m) => !rosterById.has(m.id));
        const removeIds = new Set(
          rDept.members.filter((m) => !reportById.has(m.id)).map((m) => m.id),
        );

        let rosterMembers = rDept.members
          .filter((m) => !removeIds.has(m.id))
          .map((m) => {
            const rm = reportById.get(m.id);
            return rm && rm.group !== m.group ? { ...m, group: rm.group } : m;
          });

        for (const m of toAdd) {
          rosterMembers = [
            ...rosterMembers,
            { id: m.id, name: m.name, ...(m.group ? { group: m.group } : {}) },
          ];
        }

        if (
          toAdd.length > 0 ||
          removeIds.size > 0 ||
          rDept.members.some((m) => {
            const rm = reportById.get(m.id);
            return rm && rm.group !== m.group;
          })
        ) {
          nextDepts = {
            ...nextDepts,
            [key]: { kind: "flat", members: rosterMembers },
          };
          changed = true;
        }
      }

      const reportAdult = upgradedReport.departments.adult;
      const rAdult = prev.departments.adult;
      if (rAdult.kind === "zoned" && reportAdult.zones) {
        const rosterZoneById = new Map(rAdult.zones.map((z) => [z.id, z]));
        let adultChanged = false;
        const newRosterZones = reportAdult.zones.map((reportZone) => {
          const rosterZone = rosterZoneById.get(reportZone.id);
          const rosterMemberById = new Map(
            (rosterZone?.members ?? []).map((m) => [m.id, m]),
          );
          const newMembers = reportZone.members.map(
            (rm) => rosterMemberById.get(rm.id) ?? { id: rm.id, name: rm.name },
          );
          const oldIds = (rosterZone?.members ?? []).map((m) => m.id).join(",");
          const newIds = newMembers.map((m) => m.id).join(",");
          if (oldIds !== newIds) adultChanged = true;
          return {
            ...(rosterZone ?? {
              id: reportZone.id,
              name: reportZone.name,
              district: reportZone.district,
            }),
            members: newMembers,
          };
        });
        if (adultChanged) {
          nextDepts = {
            ...nextDepts,
            adult: { kind: "zoned", zones: newRosterZones },
          };
          changed = true;
        }
      }

      if (!changed) return prev;
      const nextRoster: MemberRoster = {
        ...prev,
        departments: nextDepts,
        updatedAt: new Date().toISOString(),
      };
      void firestoreSaveRoster(nextRoster);
      return nextRoster;
    });
  }

  async function handleSave() {
    if (!currentAccount) {
      setSaveStatus("로그인 후 저장할 수 있습니다.");
      return;
    }

    const reportToSave = reportWithAccount(report, currentAccount);
    const validationErrors = validateReportForSave(reportToSave);

    if (validationErrors.length) {
      setSaveErrors(validationErrors);
      setSaveStatus(validationErrors[0]);
      return;
    }

    setSaveStatus("저장 중...");
    await firestoreSaveReport(reportToSave);
    await localSaveReport(reportToSave); // 로컬 캐시

    setSaveErrors([]);
    const upgradedReport = upgradeReportForEditor(reportToSave);
    setReport(upgradedReport);
    saveReportDraft(upgradedReport);
    const nextReports = mergeReports(reports, [upgradedReport]);
    setReports(nextReports);
    setSaveStatus(`${currentAccount.displayName}으로 저장되었습니다.`);

    // GitHub Gist 백업 (PAT 있을 때만, 실패해도 무시)
    void uploadToGist({ reports: nextReports, roster });
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
    void firestoreSaveRoster(nextRoster);
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
    await firestoreDeleteReport(storedReport.id);
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

    await firestoreSaveReports(importedReports);
    await localSaveReports(importedReports);

    const latest = latestReport(importedReports);
    if (latest) {
      const upgradedReport = upgradeReportForEditor(latest);
      setReport(upgradedReport);
      saveReportDraft(upgradedReport);

      setRoster((prev) => {
        const nextRoster = mergeRosterFromReport(prev, latest);
        void firestoreSaveRoster(nextRoster);
        return nextRoster;
      });
    }

    setReports((currentReports) => mergeReports(currentReports, importedReports));
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
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
  }

  if (!isHydrated) {
    return <main className="app-shell" />;
  }

  if (!currentAccount) {
    return (
      <main className="app-shell auth-shell">
        <AuthGate onCreated={handleSignedIn} onSignedIn={handleSignedIn} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {showMigrationDialog && (
        <div className="migration-dialog-overlay">
          <div className="migration-dialog">
            <h2>기존 데이터 이전</h2>
            <p>
              이 기기에 저장된 보고서 {pendingMigrationReports.length}개를
              클라우드로 이전하시겠습니까?
            </p>
            <div className="migration-dialog-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleMigrate()}
              >
                이전하기
              </button>
              <button type="button" onClick={handleMigrationSkip}>
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
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
            <span className="pwa-installed-badge" aria-label="앱 설치됨">
              ✓ 설치됨
            </span>
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
            <ReporterAccountPanel
              currentAccount={currentAccount}
              onSignOut={() => void handleSignOut()}
            />
          }
          canSave={!!currentAccount}
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
          githubPanel={
            currentAccount.role === "admin" ? <GithubSettingsPanel /> : undefined
          }
          onChange={handleReportChange}
          onNewReport={handleNewReport}
          onSave={handleSave}
          saveErrors={saveErrors}
          saveStatus={saveStatus}
          saveDisabledReason="로그인 후 저장할 수 있습니다."
        />
      ) : mode === "roster" ? (
        <main className="roster-shell">
          {roster && (
            <MemberRosterTab roster={roster} onChange={handleRosterChange} />
          )}
        </main>
      ) : (
        <ReportViewer report={report} reports={reports} />
      )}
    </main>
  );
}
