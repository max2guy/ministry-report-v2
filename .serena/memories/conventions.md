# Conventions

## TypeScript
- Strict mode. Prefer `type` over `interface` for domain types.
- No default exports except React components (some files use named exports for components too).
- `as const` for string literal unions in domain types.

## React
- Functional components only. No class components.
- State lives in `App.tsx`; features receive props/callbacks (mostly prop-drilled).
- Custom hooks prefixed with `use` (e.g. `useAppMode`, `usePermissions`).
- Async handlers named `handle*` (e.g. `handleSave`, `handleSignOut`).

## File Naming
- Components: PascalCase `.tsx`
- Hooks/utils: camelCase `.ts`
- Tests: `*.test.ts` / `*.test.tsx` co-located with source

## Domain / Storage Split
- `src/domain/` — pure functions, no side effects, no Firebase/IDB imports.
- `src/storage/` — all I/O (Firebase, IndexedDB). No React.
- `src/features/` — React components + hooks. May import domain + storage.

## Korean Strings
- UI strings are in Korean. Do not translate to English in code.
- Date format: `YYYY-MM-DD` (ISO) for storage; `ko-KR` locale for display.

## Report Departments
- `elementary`, `middleHigh`, `youngAdult`: flat member lists
- `adult`: zoned (array of `DepartmentZone`, each with members)
- Always call `upgradeReportForEditor(report)` before passing to editor UI.
