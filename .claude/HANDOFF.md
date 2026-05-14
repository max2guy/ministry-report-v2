# ministry-report-v2 — Codex Handoff (v2.4.25)

## 현재 상태
- 최신 커밋: `7d9e3d4` — fix(v2.4.25): add persistentLocalCache fallback and auth timeout guard
- 브랜치: `main`
- GitHub Pages 자동 배포 (push → CI → deploy)

## 방금 수정한 내용

### src/lib/firebase.ts
- `persistentLocalCache()` 초기화를 try/catch로 감쌈
- IndexedDB를 지원하지 않는 환경(iOS 개인정보 보호 모드, 일부 WebView)에서 앱이 조용히 크래시되던 문제 방지
- 실패 시 `getFirestore(app)`으로 폴백 (인메모리 캐시)

### src/App.tsx
- `authTimedOut` 상태 추가
- Firebase Auth가 2초 내에 응답하지 않으면 `<AuthGate>`를 표시
- 네트워크 불안정/Auth 무응답 시 무한 빈 화면 방지
- `isHydrated`를 강제로 true로 설정하지 않음 (Codex의 실수 반복 안 함)

### package.json
- 버전 2.4.21 → 2.4.25

## 이전 세션 컨텍스트 (Codex가 유발한 회귀 분석 및 수정)

v2.4.21까지: Claude Code가 구현한 기능들
- v2.4.15: Firestore undefined 필드 sanitize
- v2.4.16: viewer `white-space: pre-wrap` (엔터 유지)
- v2.4.17: 종합의견 필드 normalizeDepartment() (저장된 보고서 편집 시 빈 칸 방지)
- v2.4.18: 뷰어 탭바를 고정 헤더 안으로 이동 (스크롤 갭 제거)
- v2.4.19: 연속결석자 정렬(주차 내림차순→가나다순) + 윤승희→윤승휘 자동 교정
- v2.4.20: useEffect→useLayoutEffect (ResizeObserver, 헤더-카드 겹침 방지)
- v2.4.21: CSS 모바일 헤더 컴팩트 (Codex, 유지됨)

v2.4.22~24: Codex 회귀 (수동 revert됨)
- v2.4.22: ResizeObserver 제거 (헤더 높이 추적 불가)
- v2.4.23: setTimeout 강제 hydration → 빈 화면 / firebase.ts try/catch 추가 (좋은 아이디어지만 revert됨)
- v2.4.24: authFallbackReady 복잡도 추가 (여전히 빈 화면)
- revert 1460215: App.tsx + firebase.ts 모두 v2.4.21로 복원

v2.4.25: Codex의 좋은 아이디어(firebase fallback)를 올바르게 재구현 + auth timeout guard 추가

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증**: Firebase Auth (Google 로그인)
- **DB**: Firestore (오프라인 캐시 지원)
- **배포**: GitHub Pages (`gh-pages` 브랜치)
- **빌드**: `npm run build` → `dist/`
- **개발 서버**: `npm run dev` → `http://localhost:5173`

## 주요 파일

| 파일 | 역할 |
|------|------|
| `src/App.tsx` | 앱 최상위 컴포넌트, Auth/데이터 상태 관리 |
| `src/lib/firebase.ts` | Firebase 초기화 (auth, db) |
| `src/domain/reportTypes.ts` | MinistryReport 타입 + 정규화/업그레이드 함수 |
| `src/domain/memberRoster.ts` | MemberRoster 타입 + 기본값 생성 |
| `src/storage/firestoreReportStore.ts` | Firestore 보고서 CRUD + sanitize |
| `src/storage/firestoreRosterStore.ts` | Firestore 명단 로드/저장 + 이름 오타 교정 |
| `src/features/report/statsUtils.ts` | 연속결석 계산, 출석률 통계 |
| `src/features/report/ReportCanvas.tsx` | 보고서 뷰어 렌더링 |
| `src/styles.css` | 전체 CSS (mobile-first, CSS 변수 --top-bar-height) |

## 알려진 특이사항
- `--top-bar-height` CSS 변수: `useLayoutEffect` + `ResizeObserver`로 고정 헤더 높이를 동적으로 추적
- `persistentLocalCache` 폴백: 이제 try/catch로 보호됨
- Service Worker: dev 환경에서 등록 비활성화 (SW 캐시 문제 방지)
- Firestore 오타 교정: `firestoreLoadRoster()`에서 `윤승희→윤승휘` 자동 수정

## 다음으로 할 수 있는 작업
- 빈 화면 시 로딩 스피너 표시 (2초 타임아웃 전)
- 보고서 PDF 내보내기
- 통계 차트 개선 (월별 출석률 트렌드)

## 빌드 & 배포
```bash
npm run build    # TypeScript 빌드 + Vite 번들
npm run deploy   # GitHub Pages 배포 (gh-pages 브랜치)
npm run dev      # 개발 서버 (localhost:5173)
```
