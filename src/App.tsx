import { useEffect, useState } from "react";
import type { Account } from "./auth/authTypes";
import { isSuperAdmin } from "./auth/authTypes";
import { onAuthChange, signOut as firebaseSignOut } from "./auth/firebaseAuthStore";
import { usePermissions } from "./auth/usePermissions";
import { ThemeSelector } from "./features/theme/ThemeSelector";
import { applyTheme, getStoredTheme } from "./features/theme/useTheme";
import { useAppMode } from "./features/mode/useAppMode";
import { AppModeToggle } from "./features/mode/AppModeToggle";
import { BottomTabBar, type MobileTab } from "./features/nav/BottomTabBar";
import { DesktopSidebar, type DesktopMode } from "./features/nav/DesktopSidebar";
import { MobileReportList } from "./features/report/MobileReportList";
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
import { InstallGuideBanner } from "./features/pwa/InstallGuideBanner";
import { AuthGate } from "./features/auth/AuthGate";
import { ReporterAccountPanel } from "./features/auth/ReporterAccountPanel";
import { LegacyImportPanel } from "./features/import/LegacyImportPanel";
import { ReportEditor } from "./features/report/ReportEditor";
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

  const byKo = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, "ko");

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
    members.sort(byKo);
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
      members.sort(byKo);
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

function downloadCurrentReport(report: MinistryReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.reportDate}-ministry-report-v2.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  const { state: installState, triggerInstall } = useInstallPrompt();

  const [mode, setMode] = useState<DesktopMode>("edit");
  const [appMode, setAppMode] = useAppMode();
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [mobileScreen, setMobileScreen] = useState<"list" | "editor">("list");
  const [viewerTabIdx, setViewerTabIdx] = useState(0);
  const [roster, setRoster] = useState<MemberRoster | undefined>();
  const [report, setReport] = useState(() => createEmptyReport());
  const [reports, setReports] = useState<MinistryReport[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const permissions = usePermissions(currentAccount);
  // Firebase Auth가 2초 내에 응답하지 않으면 AuthGate를 표시해 빈 화면 방지
  const [authTimedOut, setAuthTimedOut] = useState(false);
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

  // ── 초기화(Hydration) 흐름 ──────────────────────────────────────
  // 1. onAuthChange: Firebase Auth 상태 수신
  //    - 비로그인 → isHydrated=true, 로그인 → loadCloudData() → isHydrated=true
  // 2. authTimedOut: 2초 내 onAuthChange 미발화 시 AuthGate 노출 (빈 화면 방지)
  // 3. handleSignedIn: AuthGate 경유 수동 로그인 시 loadCloudData() 직접 호출
  //    (onAuthChange와 중복 실행될 수 있으나 mergeReports로 안전하게 병합)
  // ─────────────────────────────────────────────────────────────────

  // [1] Firebase Auth 상태 구독 → Firestore 데이터 로드
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

  // [2] Auth 타임아웃: 2초 후에도 isHydrated=false 이면 AuthGate 표시
  useEffect(() => {
    const timer = setTimeout(() => setAuthTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // [권한 가드] viewer 역할 → edit 모드 진입 시 view로 강제 전환
  useEffect(() => {
    if (mode === "edit" && !permissions.canEditReport && currentAccount) {
      setMode("view");
    }
  }, [mode, permissions.canEditReport, currentAccount]);

  // [권한 가드] viewer 역할 → appMode를 항상 "viewer"로 고정
  useEffect(() => {
    if (appMode === "reporter" && !permissions.canCreateReport && currentAccount) {
      setAppMode("viewer");
    }
  }, [appMode, permissions.canCreateReport, currentAccount, setAppMode]);

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
      // 같은 보고서(ID 동일)일 때는 더 최신 버전 우선 사용.
      // 다른 기기에서 저장 후 열면 Firestore 버전이 더 최신이므로 cloud 우선.
      // 같은 기기에서 미저장 편집 중이면 draft가 더 최신이므로 draft 유지.
      const initialReport =
        draft && latest && draft.id === latest.id
          ? draft.updatedAt > latest.updatedAt
            ? draft
            : latest
          : (draft ?? latest);

      setReports(sortReports(cloudReports));
      setRoster(storedRoster);
      if (initialReport) {
        const upgraded = upgradeReportForEditor(initialReport);
        setReport(reportWithAccount(upgraded, account));
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
    // AuthGate 경유 로그인(auth 타임아웃 후 수동 로그인)에서도
    // onAuthChange와 무관하게 데이터를 확실히 불러옴
    void loadCloudData(account);
  }

  function handleDisplayNameChange(newName: string) {
    setCurrentAccount((prev) => prev ? { ...prev, displayName: newName } : prev);
    // 현재 보고서 보고자 이름도 동기화
    setReport((prev) => {
      const next = { ...prev, pastorName: newName, updatedAt: new Date().toISOString() };
      saveReportDraft(next);
      return next;
    });
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
    try {
      await firestoreSaveReport(reportToSave);
      await localSaveReport(reportToSave); // 로컬 캐시

      setSaveErrors([]);
      const upgradedReport = upgradeReportForEditor(reportToSave);
      setReport(upgradedReport);
      saveReportDraft(upgradedReport);
      const nextReports = mergeReports(reports, [upgradedReport]);
      setReports(nextReports);
      setSaveStatus(`저장되었습니다.`);

      // GitHub Gist 백업 (PAT 있을 때만, 실패해도 무시)
      void uploadToGist({ reports: nextReports, roster });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("저장 실패:", err);
      setSaveStatus(`저장 실패: ${msg}`);
    }
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
    setMobileScreen("editor");
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
    setMobileScreen("editor");
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
    // Auth 타임아웃 후에는 빈 화면 대신 로그인 화면을 표시
    if (authTimedOut) {
      return (
        <>
          <InstallGuideBanner />
          <main className="app-shell auth-shell">
            <AuthGate onSignedIn={handleSignedIn} />
          </main>
        </>
      );
    }
    return (
      <>
        <InstallGuideBanner />
        <main className="app-shell" />
      </>
    );
  }

  if (!currentAccount) {
    return (
      <>
        <InstallGuideBanner />
        <main className="app-shell auth-shell">
          <AuthGate onSignedIn={handleSignedIn} />
        </main>
      </>
    );
  }

  // 뷰어 탭 목록 계산 (헤더 + ReportViewer 공유)
  const viewerTabs: { key: "summary" | "elementary" | "middleHigh" | "youngAdult" | "adult"; label: string }[] = [
    { key: "summary", label: "통합보고" },
  ];
  const flatDeptDefs = [
    { key: "elementary" as const, label: "유초등부" },
    { key: "middleHigh" as const, label: "중고등부" },
    { key: "youngAdult" as const, label: "청년부" },
  ];
  for (const { key, label } of flatDeptDefs) {
    if ((report.departments[key].members?.length ?? 0) > 0) viewerTabs.push({ key, label });
  }
  if ((report.departments.adult.zones?.length ?? 0) > 0) viewerTabs.push({ key: "adult", label: "교구" });
  const safeTabIdx = Math.min(viewerTabIdx, viewerTabs.length - 1);
  // 모바일 전용: 뷰어 탭바 오버레이 표시 조건 (CSS .viewer-tab-bar는 데스크탑에서 display:none)
  const showViewerTabs =
    viewerTabs.length > 1 &&
    appMode === "viewer" &&
    mobileTab === "edit" &&
    mobileScreen === "editor";

  return (
    <main className={`app-shell${showViewerTabs ? " has-viewer-tabs" : ""}`}>
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
        {/* Safe area 전용 spacer — 콘텐츠와 분리해 타이틀 위치를 일정하게 유지 */}
        <div className="top-bar-safe-spacer" aria-hidden="true" />
        <div className="top-bar-title-row">
          <div className="top-bar-title-group">
            <span className="top-bar-date">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
            <h1>사역보고서 <span className="top-bar-version">v{__APP_VERSION__}</span>{appMode === "viewer" && <span className="top-bar-viewer-badge">뷰어</span>}</h1>
          </div>
          <div className="top-bar-actions">
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
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
            </button>
            {currentAccount && (
              <div
                className="top-bar-avatar"
                title={currentAccount.displayName}
                aria-label={`로그인: ${currentAccount.displayName}`}
              >
                {currentAccount.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
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
        <p className="app-version-label desktop-only">v{__APP_VERSION__}</p>
      </header>
      {showViewerTabs && (
        <div className="viewer-tab-bar" role="tablist" aria-label="부서 탭">
          {viewerTabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={i === safeTabIdx}
              className={`viewer-dept-tab-btn${i === safeTabIdx ? " is-active" : ""}`}
              onClick={() => setViewerTabIdx(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {/* Mobile-only: MobileReportList home OR editor screen */}
      <div className="mobile-only">
        {mobileTab === "account" ? (
          <div className="mobile-account-screen">
            <ReporterAccountPanel
              currentAccount={currentAccount}
              onSignOut={() => void handleSignOut()}
              onDisplayNameChange={handleDisplayNameChange}
            />
            <div className="settings-card">
              <p className="settings-card-label">테마</p>
              <ThemeSelector />
            </div>
            {permissions.canCreateReport && (
              <>
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
              </>
            )}
            {(currentAccount?.role === "admin" || isSuperAdmin(currentAccount)) && <GithubSettingsPanel />}
            <p className="app-version-label">v{__APP_VERSION__}</p>
          </div>
        ) : mobileTab === "roster" ? (
          <main className="roster-shell">
            {roster && (
              <MemberRosterTab roster={roster} onChange={handleRosterChange} visibleDepts={permissions.visibleDepts} />
            )}
          </main>
        ) : mobileScreen === "list" ? (
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
        ) : (
          <div className="mobile-editor-screen">
            {appMode === "reporter" && (
              <div className="mobile-editor-back-bar">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setMobileScreen("list")}
                >
                  ‹ 보고서 목록
                </button>
                <span className="mobile-editor-context-badge">
                  {report.reportDate} 수정 중
                </span>
              </div>
            )}
            {appMode === "reporter" ? (
              <>
                <ReportEditor
                  report={report}
                  reports={reports}
                  onChange={handleReportChange}
                  editableDepts={permissions.editableDepts}
                />
                <div className="mobile-save-bar">
                  {(saveStatus || saveErrors.length > 0) && (
                    <p className={`mobile-save-status${saveErrors.length ? " is-error" : saveStatus === "저장되었습니다." ? " is-success" : ""}`}>
                      {saveErrors.length > 0 ? saveErrors[0] : saveStatus}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mobile-save-bar-btn"
                    disabled={!currentAccount || saveStatus === "저장 중..."}
                    onClick={handleSave}
                    title={!currentAccount ? "로그인 후 저장할 수 있습니다." : undefined}
                  >
                    {saveStatus === "저장 중..." ? "저장 중…" : "저장하기"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <ReportViewer
                  report={report}
                  reports={reports}
                  activeTabIdx={safeTabIdx}
                  tabs={viewerTabs}
                  onTabChange={setViewerTabIdx}
                />
              </>
            )}
          </div>
        )}
      </div>

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
          onExport={() => downloadCurrentReport(report)}
          installState={installState}
          onInstall={() => void triggerInstall()}
          onForceRefresh={() => void handleForceRefresh()}
          reports={reports}
          currentReportId={report.id}
          onLoadReport={handleLoadReport}
          onDeleteReport={handleDeleteReport}
          onDuplicateReport={handleDuplicateReport}
        />
        <div className="desktop-center">
          {mode === "edit" && (
            <div className="desktop-edit-area">
              <ReportEditor
                report={report}
                reports={reports}
                onChange={handleReportChange}
                editableDepts={permissions.editableDepts}
              />
            </div>
          )}
          {mode === "view" && (
            <div className="desktop-edit-area">
              <ReportViewer
                report={report}
                reports={reports}
                activeTabIdx={safeTabIdx}
                tabs={viewerTabs}
                onTabChange={setViewerTabIdx}
              />
            </div>
          )}
          {mode === "roster" && (
            <div className="desktop-edit-area">
              {roster && (
                <MemberRosterTab
                  roster={roster}
                  onChange={handleRosterChange}
                  visibleDepts={permissions.visibleDepts}
                />
              )}
            </div>
          )}
          {mode === "settings" && (
            <div className="desktop-edit-area">
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
            </div>
          )}
        </div>
      </div>
      <BottomTabBar
        activeTab={mobileTab}
        onTabChange={(tab) => {
          setMobileTab(tab);
          if (tab === "edit") {
            setMode("edit");
            setMobileScreen("list");
          } else if (tab === "roster") {
            setMode("roster");
            setMobileScreen("list");
          } else {
            setMobileScreen("list");
          }
        }}
        canAccessRoster={permissions.canAccessRoster}
      />
    </main>
  );
}
