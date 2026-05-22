# Service Worker & IndexedDB Pitfalls

## Service Worker
- **Never register SW in dev** (Vite dev server). `vite-plugin-pwa` with `registerType: "autoUpdate"` only activates in production build.
- Dev server must run on `http://127.0.0.1:5173` — not `localhost` alias, not `0.0.0.0`. Origin-keyed APIs (IndexedDB, SW) are sensitive to host.
- `handleForceRefresh()` in App.tsx: unregisters all SWs + clears all caches + reloads.

## IndexedDB
- Local store is a cache/offline fallback; Firestore is source of truth.
- On first cloud load: if Firestore empty and IndexedDB has data → migration dialog offered.
- If data appears missing after dev reload: check if wrong origin was used or SW interfered.
- Recovery: open DevTools → Application → IndexedDB / Storage → clear site data, or trigger `handleForceRefresh`.

## Data Flow
```
Firestore (cloud) ←→ App state ←→ IndexedDB (local cache)
                              ↕
                       reportDraftStore (sessionStorage, current draft)
```
