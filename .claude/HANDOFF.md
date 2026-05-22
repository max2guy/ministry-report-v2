# ministry-report-v2 — Codex Handoff (v2.6.2)

## 현재 상태
- 브랜치: main
- 최신 커밋: 094842f fix: 버그 수정 3건 (정렬/auth race/주석)
- 버전: 2.6.2

## 방금 수정한 내용
- **문제**: JS 번들이 849KB(gzip 221KB)로 Vite 500KB 경고 발생
- **해결**: `vite.config.ts`에 `build.rollupOptions.output.manualChunks` 추가
  - `vendor`: react, react-dom, react-is, scheduler
  - `firebase-firestore`: @firebase/firestore (328KB)
  - `firebase-auth`: @firebase/auth (111KB)
  - `firebase-core`: 나머지 firebase/* 패키지 (94KB)
  - `index`: 앱 코드 (118KB)
- 결과: 500KB 초과 청크 없음, 500KB 경고 제거됨

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite 6
- **스타일**: CSS Modules / Tailwind 없음 (순수 CSS)
- **인증/DB**: Firebase Auth (Google OAuth) + Firestore
- **PWA**: vite-plugin-pwa (workbox generateSW 모드)
- **빌드**: `npm run build` (tsc --noEmit && vite build)
- **테스트**: `npm test` (vitest, 31 tests, jsdom 환경)

## 주요 파일
- `vite.config.ts` — Vite 설정, manualChunks 포함
- `src/App.tsx` — 최상위 컴포넌트 (941줄)
- `src/lib/firebase.ts` — Firebase 초기화 (app, auth, db)
- `src/auth/firebaseAuthStore.ts` — Auth 상태 관리
- `src/domain/` — 순수 도메인 로직 (테스트 커버리지 있음)
- `src/features/` — UI 기능별 폴더 (report, roster, sync 등)
- `src/storage/` — IndexedDB 기반 로컬 스토리지

## 다음으로 할 수 있는 작업
- Firebase 청크를 dynamic import()로 추가 분리 (lazy load)
- App.tsx 분할 (React.lazy + Suspense로 라우트 레벨 코드 스플리팅)
- CSS 번들(61KB) 최적화
- Lighthouse PWA 점수 재측정

## 빌드 & 배포
```bash
npm run build     # TypeScript 검사 + Vite 빌드
npm test          # vitest run (31 tests)
npm run preview   # 빌드 결과물 로컬 미리보기
```
- GitHub Actions에서 GITHUB_ACTIONS=true 시 base=/ministry-report-v2/
- dev에서 SW 등록 금지 (localhost:5173 고정)
