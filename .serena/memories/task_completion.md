# Task Completion

Run these after any code change before considering done:

```bash
npm run build        # type-check + bundle (catches TS errors)
npm test             # vitest unit tests
```

For UI / PWA changes also run:
```bash
npm run smoke:dev    # playwright E2E against dev server
```

Full verification:
```bash
npm run verify       # npm test && npm run smoke (build + E2E)
```

## Checklist
- [ ] `npm run build` passes (no TS errors, no vite errors)
- [ ] `npm test` passes
- [ ] If storage/domain logic changed: relevant `*.test.ts` updated
- [ ] If report schema changed: migration added in `reportMigrations.ts`, version bumped
- [ ] SW/IndexedDB: no SW registration in dev. See `mem:sw_indexeddb`.
