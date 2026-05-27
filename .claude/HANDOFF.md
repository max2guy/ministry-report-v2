# ministry-report-v2 — Codex Handoff (v2.7.8)

## 현재 상태
- 브랜치: `main`
- 버전: 2.7.8

## 방금 수정한 내용

### Fix 1: AuthGate 이미지 경로 수정 (GitHub Pages 서브디렉토리 대응)
- **파일**: `src/features/auth/AuthGate.tsx`
- **문제**: `src="pwa-192x192.png"` — 상대 경로는 GitHub Pages `/ministry-report-v2/` 서브 경로에서 404 발생 가능
- **수정**: `src={`${import.meta.env.BASE_URL}pwa-192x192.png`}` 로 변경

### Fix 2: InstallGuideBanner localStorage 크래시 방지
- **파일**: `src/features/pwa/InstallGuideBanner.tsx`
- **문제**: iOS Safari 개인정보 보호 모드에서 `localStorage` 접근 시 예외 발생 → 앱 크래시
- **수정**: `safeGetItem()` / `safeSetItem()` 래퍼 함수 추가 (try/catch), 모든 localStorage 호출을 래퍼로 교체

### Fix 3: manifest.webmanifest 충돌 해소
- **파일**: `public/manifest.webmanifest` 삭제, `vite.config.ts` 수정
- **문제**: `public/manifest.webmanifest`가 존재하지만 빌드 시 VitePWA가 덮어씀(데드파일). apple-touch-icon-180x180.png가 VitePWA 생성 manifest에서 누락됨
- **수정**:
  - `public/manifest.webmanifest` 삭제
  - `vite.config.ts` manifest icons 배열에 `apple-touch-icon-180x180.png` 추가

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript PWA
- **인증/DB**: Firebase Auth + Firestore + FCM
- **스타일**: 단일 파일 `src/styles.css` (모바일 기본, `@media (min-width: 821px)` 데스크탑 오버라이드)
- **빌드**: `npm run build`
- **배포**: GitHub Actions → GitHub Pages (`https://max2guy.github.io/ministry-report-v2/`)
- **테스트**: `npm test`

## 주요 파일
- `src/App.tsx` — 루트 컴포넌트, 인증 상태 관리
- `src/styles.css` — 전체 스타일 (단일 파일)
- `src/features/auth/AuthGate.tsx` — 로그인 화면
- `src/features/report/TabbedReportForm.tsx` — 보고서 작성 탭 폼
- `src/features/theme/useTheme.ts` — 테마 관리 (기본: 파란색)
- `src/features/pwa/InstallGuideBanner.tsx` — PWA 설치 안내 (카카오톡/iOS/Android)
- `vite.config.ts` — Vite + VitePWA 설정 (manifest, workbox)
- `index.html` — FOUC 방지 인라인 스크립트 포함

## 다음으로 할 수 있는 작업
- 중고등부 통계 색상 (#0f766e, 초록) 변경 여부 결정 (사용자가 보류 중)
- 기타 UX 개선 및 새 기능

## 빌드 & 배포
```bash
npm run build        # dist/ 생성
npm test             # 테스트 실행
git push origin main # GitHub Actions 자동 배포 트리거
```
