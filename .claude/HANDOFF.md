# ministry-report-v2 — Codex Handoff (v2.7.16)

## 현재 상태
- 버전: 2.7.16
- 브랜치: main
- 최근 커밋: feat: add ByeolmyeongbuMember type and move/restore helpers → feat: add byeolmyeongbu button → feat: create ByeolmyeongbuEditor → feat: wire ByeolmyeongbuEditor → style: add byeolmyeongbu CSS

## 방금 수정한 내용

### 별명부 기능 추가 (교구 전용)
- 교구 구역원을 타교/요양/장기결석/소재불명 사유로 별명부로 이동 가능
- 별명부 멤버는 보고서 출결체크 명단 및 전체 인원에서 자동 제외
  - `syncReportFromRoster`가 구역 멤버만 읽기 때문에 byeolmyeongbu 멤버는 자동 제외됨
- 복귀 버튼으로 원래 구역(fromZoneId)으로 되돌릴 수 있음. 구역이 없으면 첫 번째 구역으로.
- 삭제 버튼으로 별명부에서 완전 제거 (구역 복귀 없이)

**수정 파일:**
- `src/domain/memberRoster.ts`: `ByeolmyeongbuReason`, `ByeolmyeongbuMember` 타입 + `MemberRoster.byeolmyeongbu?` 필드 + `moveToByeolmyeongbu` / `restoreFromByeolmyeongbu` 헬퍼 함수
- `src/features/roster/RosterZoneEditor.tsx`: 구역원 행에 "별명부" 버튼 + 인라인 사유 선택기 (`byeol-*` CSS 클래스)
- `src/features/roster/ByeolmyeongbuEditor.tsx` (신규): 별명부 목록 UI — 이름/사유/원래구역/복귀·삭제 버튼
- `src/features/roster/MemberRosterTab.tsx`: 교구 탭에 `<ByeolmyeongbuEditor>` 추가 (PhoneNumberManager 위)
- `src/styles.css`: `.byeolmyeongbu-*`, `.byeol-*` CSS 클래스 추가

### v2.7.15 이전 버그 수정 (참고)
- 박승애 등 삭제된 구역원이 출결 편집기에 다시 나타나던 문제 수정
  - `handleReportChange`의 adult zone Report→Roster 역방향 동기화 제거
  - `handleLoadReport`에 `syncReportFromRoster` 호출 추가

## 프로젝트 개요
- React 19 + Vite + TypeScript PWA
- Firebase Auth + Firestore (persistentLocalCache, IndexedDB) + FCM
- Firestore `roster/shared`: 전체 유저 공유 단일 문서 (명단)
- Firestore `reports`: 보고서 컬렉션 (id 기준 문서)
- `syncReportFromRoster()` in App.tsx: roster → report 단방향 동기화 (roster가 권위)
- 빌드: `npm run build` / 테스트: `npm test`

## 주요 파일
- `src/App.tsx`: 앱 전체 상태, `loadCloudData`, `syncReportFromRoster`, `handleRosterChange`, `handleLoadReport`
- `src/domain/memberRoster.ts`: `MemberRoster` 타입, 별명부 타입/헬퍼 포함
- `src/domain/reportTypes.ts`: `MinistryReport`, `DepartmentKey` 등 보고서 타입
- `src/features/roster/RosterZoneEditor.tsx`: 교구 구역 편집 UI + 별명부 이동 버튼
- `src/features/roster/ByeolmyeongbuEditor.tsx`: 별명부 목록 UI
- `src/features/roster/MemberRosterTab.tsx`: 명단 탭 전체 (부서 탭 바 + 내용)
- `src/storage/firestoreRosterStore.ts`: Firestore roster 저장/로드

## 다음으로 할 수 있는 작업
- 별명부 멤버 사유 변경 기능 (현재는 사유 수정 불가, 삭제 후 재등록 필요)
- 별명부 이동 날짜 기록
- 별명부 항목 정렬 (사유별, 이름별)
- 구역 추가/삭제/이름 변경 기능 (현재는 기본 12구역 고정)

## 빌드 & 배포
```bash
npm run build          # TypeScript 체크 + Vite 빌드
npm test               # Vitest 단위 테스트
firebase deploy        # Firebase Hosting 배포 (firebase CLI 필요)
```
