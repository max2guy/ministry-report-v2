# Ministry Report v2

Separate v2 project for the ministry report app.

## Goal

Build one upgraded PWA where the report app and viewer app share the same UI, data model, and rendering components. The report expands to four departments: 유초등부, 중고등부, 청년부, 장년. Reporters need internal accounts created with personal email addresses.

## Core Rules

- Keep this project separate from the existing ministry report app.
- Preserve legacy data through import/migration before changing schema.
- Require reporter sign-up with a real personal email address and password.
- Keep account handling lightweight for church-internal use.
- Support admin-assisted password recovery by setting a temporary password.
- Do not build Word document generation or NAS upload features in v2.
- Prefer CLI-first development with `npm run build`, `npm test`, and browser smoke checks.
- Keep dependencies small and avoid background-heavy sync or indexing.

## Commands

- Install dependencies: `npm install`
- Start local development: `npm run dev`
- Run unit tests: `npm test`
- Build production files: `npm run build`
- Run production browser smoke tests: `npm run smoke`
- Run dev-server browser smoke tests: `npm run smoke:dev`
- Run the full release gate: `npm run verify`

## Release Check

Run `npm run verify` before sharing a build. It runs unit tests, builds production files, serves `dist` through Vite preview, and runs Playwright smoke tests for the account, report, import, backup, offline, viewer, and print flows.

## Operating Notes

- Create one reporter account per person with that person's email address.
- If a reporter forgets a password, use 관리자 복구 to set a temporary password.
- A reporter who logs in with a temporary password must change it before saving reports.
- Use 뷰어 > 인쇄 for paper/PDF output instead of Word document generation.
- Keep Word document generation and NAS upload out of v2.

## Data Safety

- Use 전체 백업 before sharing, updating, or clearing browser data.
- Store the downloaded `*-ministry-report-v2-backup.json` file somewhere outside the browser.
- To restore, import that backup file through 기존 JSON.
- Single report JSON exports can also be imported again through 기존 JSON.
- All data is local to the installed browser/app unless a backup file is moved manually.

## Plan

See `docs/superpowers/plans/2026-04-30-ministry-report-v2.md`.
