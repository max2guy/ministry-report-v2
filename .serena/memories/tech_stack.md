# Tech Stack

- **Language**: TypeScript 5.8, strict mode
- **UI**: React 19, no state management library (useState/useEffect in App.tsx)
- **Build**: Vite 6, `vite-plugin-pwa` (Workbox autoUpdate)
- **Package manager**: npm
- **Firebase**: v12, Auth (Google sign-in) + Firestore + (no FCM in v2)
- **IndexedDB**: `idb` library for local storage adapter
- **Testing**: Vitest (unit, jsdom env), Playwright (smoke/E2E)
- **Type checking**: `tsc --noEmit` (part of build script)
- **Deployment**: GitHub Pages (`/ministry-report-v2/` base in CI, `/` locally)
- **Version**: tracked in `package.json`, injected as `__APP_VERSION__` via vite `define`
