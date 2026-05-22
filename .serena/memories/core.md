# ministry-report-v2 — Core

Korean church ministry attendance report PWA. React 19 + TypeScript + Firebase.

## Source Map

```
src/
  main.tsx          — entry, mounts <App>
  App.tsx           — root orchestrator: auth, state, routing between modes
  styles.css        — global styles
  globals.d.ts      — __APP_VERSION__ declare

  domain/           — pure logic, no React, no I/O
    reportTypes.ts         — MinistryReport / DepartmentReport / DepartmentMember types + factories
    memberRoster.ts        — MemberRoster type + merge helpers
    reportValidation.ts    — validateReportForSave
    reportMigrations.ts    — schema upgrade logic
    reportMembers.ts       — member-level helpers
    reportImport.ts        — legacy JSON import parsing
    reportBackup.ts        — backup/restore helpers

  storage/          — I/O adapters
    reportStore.ts         — IndexedDB local report CRUD
    memberRosterStore.ts   — IndexedDB local roster
    reportDraftStore.ts    — sessionStorage draft (in-memory draft across renders)
    firestoreReportStore.ts — Firestore report CRUD
    firestoreRosterStore.ts — Firestore roster CRUD

  auth/             — Firebase Auth wrappers + permission logic
    firebaseAuthStore.ts   — onAuthChange, signOut
    authTypes.ts           — Account type, role enum, isSuperAdmin
    usePermissions.ts      — role → {canEditReport, canCreateReport, canAccessRoster, editableDepts, visibleDepts}
    emailValidation.ts

  features/         — React feature modules
    report/         — editors, viewer, stats, SMS panel
    roster/         — member roster editor UI
    mode/           — appMode (reporter/viewer) toggle + hook
    nav/            — DesktopSidebar, BottomTabBar
    auth/           — AuthGate, UserManagementPanel, ReporterAccountPanel
    theme/          — ThemeSelector, useTheme
    pwa/            — useInstallPrompt
    sync/           — GitHub Gist backup panel
    import/         — LegacyImportPanel

  lib/firebase.ts   — Firebase app/auth/db init
```

## Key Invariants

- `MinistryReport.schemaVersion` is always 2; use `upgradeReportForEditor` before editing.
- Dual storage: Firestore (source of truth) + IndexedDB (local cache/offline).
- Report ↔ Roster bidirectional sync in `App.handleReportChange` and `App.handleRosterChange`.
- 4 departments: `elementary`, `middleHigh`, `youngAdult` (flat members), `adult` (zoned).
- Auth roles: `superAdmin` > `admin` > `reporter` > `viewer`. See `mem:auth`.
- PWA: autoUpdate Service Worker. Dev: never register SW (localhost:5173 only). See `mem:sw_indexeddb`.

## Further Memories

- Tech stack: `mem:tech_stack`
- Dev commands: `mem:suggested_commands`
- Conventions: `mem:conventions`
- Task completion: `mem:task_completion`
- Auth/roles detail: `mem:auth`
- SW/IndexedDB pitfalls: `mem:sw_indexeddb`
