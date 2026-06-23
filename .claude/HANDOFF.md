# ministry-report-v2 — Codex Handoff (v2.7.15)

## 현재 상태
- 브랜치: `main`
- 버전: 2.7.15

## 방금 수정한 내용

### 교구 멤버 삭제 후 출석체크에 재출현 버그 (v2.7.15)

**문제**: 명단(roster)의 9구역에서 박승애를 삭제해도 출석체크(attendance editor)에 계속 나타남

**근본 원인 두 가지**:

1. **`handleReportChange`의 Report→Roster 역방향 동기화** (`src/App.tsx`)
   - 출석을 수정할 때마다 report zones 기준으로 roster를 재구성
   - `?? { id: rm.id, name: rm.name }` 폴백이 roster에서 삭제된 멤버를 다시 추가해 Firestore 저장
   - **Fix**: 교구(adult) zones 역방향 동기화 블록 완전 제거

2. **`handleLoadReport`** (`src/App.tsx`)
   - 보고서 목록에서 불러올 때 `syncReportFromRoster` 미호출 → Firestore 버전(삭제 전 멤버) 그대로 사용
   - **Fix**: `handleLoadReport`에서 `syncReportFromRoster(upgradedReport, roster)` 추가

**변경 파일**: `src/App.tsx`, `package.json`, `.claude/HANDOFF.md`

## 데이터 동기화 설계 (v2.7.15 이후)
- Roster → Report: `syncReportFromRoster()` (handleRosterChange, loadCloudData, handleLoadReport)
- Report → Roster: flat 부서만 양방향 동기화 (elementary, middleHigh, youngAdult)
- 교구(adult) zones: roster 단독 권위, 역방향 동기화 없음

## 프로젝트 개요
- 프레임워크: React 19 + Vite + TypeScript PWA
- 인증/DB: Firebase Auth + Firestore + FCM (`persistentLocalCache()`)
- 배포: GitHub Actions → GitHub Pages

## 주요 파일
- `src/App.tsx` — 루트 컴포넌트, 모든 데이터 동기화 로직
- `src/features/roster/RosterZoneEditor.tsx` — 교구 명단 편집 UI
- `src/features/report/ZonedDepartmentAttendanceEditor.tsx` — 교구 출결 카드 UI
- `src/storage/firestoreRosterStore.ts` — roster Firestore 저장소

## 빌드 & 배포
```bash
npm run build
npm test
git push origin main  # GitHub Actions 자동 배포
```
