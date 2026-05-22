# Suggested Commands

## Dev
```
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc --noEmit && vite build
npm run preview      # preview production build
```

## Test
```
npm test             # vitest run (unit tests, jsdom)
npm run smoke        # build + playwright E2E
npm run smoke:dev    # playwright against running dev server (127.0.0.1:5173)
npm run verify       # npm test && npm run smoke
```

## Lint / Format
No dedicated lint script in package.json. TypeScript type-check via `npm run build`.

## Notes
- Dev server must be `127.0.0.1:5173` (not 0.0.0.0 or localhost alias) — IndexedDB origin-keyed, SW blocked in dev. See `mem:sw_indexeddb`.
- Playwright config at `playwright.config.ts`; smoke tests under `tests/`.
