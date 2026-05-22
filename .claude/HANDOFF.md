# ministry-report-v2 — Codex Handoff (v2.6.3)

## 현재 상태
- 브랜치: main
- 최신 커밋: (방금 커밋 예정)
- 버전: 2.6.3

## 방금 수정한 내용
세 가지 기능 개선:

### Task 1: 보고서 날짜/제목 입력 UI 개선
- **파일**: `src/features/report/TabbedReportForm.tsx`
- **내용**: 기본정보 탭 상단에 `info-fields-row` div 추가
  - 보고일 date input + 제목 text input을 나란히 배치
  - 기존에는 사이드바 보고서 목록에서만 날짜/제목 편집 가능했으나, 이제 탭 내부에서도 수정 가능
- **CSS**: `src/styles.css` — `.info-fields-row`, `.info-field-label` 추가 (모바일/데스크탑)

### Task 2: 출석 통계 카드 클릭 → 해당 부서 탭 이동
- **파일**: `src/features/report/TabbedReportForm.tsx`
- **내용**: 기본정보 탭의 출결 통계 카드(`.info-stat-card`)에 클릭 핸들러 추가
  - `isDeptVisible` 체크 후 해당 부서가 보이면 `handleTabChange(key)` 호출
  - `role="button"`, `tabIndex=0`, `onKeyDown` (Enter) 추가로 접근성 확보
- **CSS**: `.info-stat-card.is-clickable` — hover transform + box-shadow 애니메이션

### Task 3: 모바일 헤더 높이 고정 (갭 방지)
- **파일**: `src/App.tsx`
- **내용**: 뷰어 모드 탭바(`viewer-dept-tabs top-bar-viewer-tabs`)를 조건부 렌더링에서
  항상 렌더링 + `visibility: hidden/visible` 전환 방식으로 변경
  - 보고자/뷰어 모드 전환 시 헤더 높이 변동 없음

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite 6
- **스타일**: CSS Modules 없음 / 순수 CSS (styles.css 4500줄+)
- **인증/DB**: Firebase Auth (Google OAuth) + Firestore
- **PWA**: vite-plugin-pwa (workbox generateSW 모드)
- **빌드**: `npm run build` (tsc --noEmit && vite build)
- **테스트**: `npm test` (vitest, 31 tests, jsdom 환경)

## 주요 파일
- `vite.config.ts` — Vite 설정, manualChunks 포함 (5 청크)
- `src/App.tsx` — 최상위 컴포넌트 (~941줄)
- `src/features/report/TabbedReportForm.tsx` — 보고서 탭 폼 (편집/통계 카드)
- `src/lib/firebase.ts` — Firebase 초기화 (app, auth, db)
- `src/auth/firebaseAuthStore.ts` — Auth 상태 관리
- `src/domain/` — 순수 도메인 로직 (테스트 커버리지 있음)
- `src/features/` — UI 기능별 폴더 (report, roster, sync 등)
- `src/storage/` — IndexedDB 기반 로컬 스토리지
- `src/styles.css` — 전체 CSS (~4500줄)

## 다음으로 할 수 있는 작업
- 모바일 탭바 스와이프 제스처
- 보고서 날짜 입력 캘린더 피커 개선 (네이티브 date input 외 커스텀)
- Firebase 청크를 dynamic import()로 추가 분리 (lazy load)
- App.tsx 분할 (React.lazy + Suspense로 라우트 레벨 코드 스플리팅)
- Lighthouse PWA 점수 재측정

## 빌드 & 배포
```bash
npm run build     # TypeScript 검사 + Vite 빌드
npm test          # vitest run (31 tests)
npm run preview   # 빌드 결과물 로컬 미리보기
```
- GitHub Actions에서 GITHUB_ACTIONS=true 시 base=/ministry-report-v2/
- dev에서 SW 등록 금지 (localhost:5173 고정)
- push to main → GitHub Pages 자동 배포
