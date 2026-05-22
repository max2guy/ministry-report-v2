# Auth & Permissions

## Roles (lowest → highest)
- `viewer` — read-only, cannot edit/create reports, cannot access roster
- `reporter` — can create/edit reports for assigned depts, cannot manage users
- `admin` — full access except superAdmin ops
- `superAdmin` — email-hardcoded in `authTypes.ts`, can delete reports

## Key Files
- `src/auth/authTypes.ts` — `Account` type, `Role` enum, `isSuperAdmin(account)`
- `src/auth/usePermissions.ts` — `usePermissions(account)` → `{canEditReport, canCreateReport, canAccessRoster, editableDepts, visibleDepts}`
- `src/auth/firebaseAuthStore.ts` — `onAuthChange`, `signOut`
- `src/features/auth/AuthGate.tsx` — login UI, shown when no account
- `src/features/auth/UserManagementPanel.tsx` — admin UI for managing users

## Auth Flow
1. Firebase Auth Google sign-in
2. `onAuthChange` fires → `App.loadCloudData` loads Firestore data
3. If no Firestore data but IndexedDB has data → migration dialog shown
4. Auth timeout (2s): if Firebase doesn't respond, show AuthGate

## appMode
- `reporter` mode: user can edit/submit reports
- `viewer` mode: read-only display, enforced for `viewer` role accounts
- Stored in localStorage via `useAppMode` hook
