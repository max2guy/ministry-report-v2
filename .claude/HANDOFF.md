# ministry-report-v2 — Codex Handoff (v2.4.36)

## 현재 상태
- 커밋: `8ce8910` — feat: 보고서 구역 이동 버튼 추가 (v2.4.36)
- 브랜치: `main`

## 방금 수정한 내용
- **문제**: 보고서 작성 시 구역 간 인원 이동 기능 없음
- **해결**:
  - `src/domain/reportMembers.ts`: `moveZoneMemberToZone(department, fromZoneId, memberId, targetZoneId)` 함수 추가 — memberId 기준으로 한 구역에서 다른 구역으로 이동
  - `src/features/report/ZonedDepartmentAttendanceEditor.tsx`:
    - `ZoneGroup`에 "이동" 버튼 추가 (보라색 테두리, `.zone-btn-move`)
    - 2단계 피커 UI: ①목적 구역 선택 → ②이동할 인원 선택
    - `MoveStep` 타입 (`null | { step: "pickZone" } | { step: "pickMember"; targetZoneId: string }`)
    - `allZones` prop과 `onMoveToZone` 콜백을 `DistrictSection` → `ZoneGroup`까지 전달
  - `src/styles.css`: `.zone-btn-move`, `.zone-move-picker`, `.zone-move-options`, `.zone-move-option`, `.zone-move-cancel` 스타일 추가

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite + PWA (vite-plugin-pwa)
- **스타일**: 단일 CSS 파일 (`src/styles.css`), CSS 변수 기반 테마
- **인증/DB**: Firebase Auth + Firestore (persistentLocalCache, try/catch fallback)
- **빌드**: `npm run build` (tsc --noEmit && vite build)
- **테스트**: `npm test` (vitest), `npm run smoke` (playwright e2e)

## 주요 파일
- `src/App.tsx` — 앱 루트, 상태 관리, 라우팅, syncReportFromRoster
- `src/domain/reportTypes.ts` — 타입 정의 (MinistryReport, DepartmentZone 등)
- `src/domain/reportMembers.ts` — 출석 도메인 로직 (toggle, move, add, delete 등)
- `src/features/report/ZonedDepartmentAttendanceEditor.tsx` — 교구 출석 에디터 (구역 카드)
- `src/features/report/TabbedReportForm.tsx` — 보고서 작성 폼 (탭 네비게이션)
- `src/features/report/ReportViewer.tsx` — 보고서 보기 뷰어
- `src/features/roster/RosterFlatEditor.tsx` — 명단 편집 (유초등·중고등·청년)
- `src/features/roster/RosterZoneEditor.tsx` — 교구 명단 편집 (구역)
- `src/lib/firebase.ts` — Firebase 초기화 (persistentLocalCache with fallback)
- `src/styles.css` — 전체 스타일

## 다음으로 할 수 있는 작업
- 구역 이동 후 목적지 구역으로 스크롤 이동 (UX 개선)
- 이동된 인원을 강조 표시 (애니메이션 등)
- 보고서 PDF/이미지 내보내기
- Firebase FCM 푸시 알림 연동

## 빌드 & 배포
```bash
npm run build       # tsc + vite build
npm test            # vitest unit tests
npm run smoke       # playwright e2e (빌드 후)
npm run dev         # 개발 서버 (localhost:5173)
```
