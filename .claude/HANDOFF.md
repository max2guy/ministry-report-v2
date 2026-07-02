# ministry-report-v2 — Codex Handoff (v2.7.16)

## 현재 상태
- 버전: 2.7.16
- 브랜치: main
- 최근 커밋: fix: preserve zone member order in report (roster order is authoritative) → (이번 세션) fix: correct 6구역 member order in live Firestore data

## 방금 수정한 내용

### 6구역 구역원 순서 Firestore 데이터 교정 (이번 세션)
- 사용자가 "6구역만 아직 오류가 있군"이라며 정확한 순서를 지정: 김순이(구역장), 김미경(권찰), 김덕희, 김은주, 신영락, 노학심, 박순영, 변기성, 이순희, 박종학, 이춘생, 최봉석, 윤숙경, 최태인
- 코드 레벨 정렬 버그(아래 항목)를 고쳐도 이미 Firestore에 저장된 6구역 순서 자체는 복구되지 않으므로, `fixKnownNameTypos`와 동일한 "load 시 자동 교정 후 재저장" 패턴으로 `fixZone6MemberOrder()` 함수를 추가
- `src/storage/firestoreRosterStore.ts`: `fixZone6MemberOrder(roster)` 추가, `firestoreLoadRoster()`에서 `fixKnownNameTypos` 다음에 호출. 구역장/권찰은 그대로 두고 나머지 구역원만 지정 순서로 재배치, 지정 목록에 없는 이름은 뒤에 그대로 유지. 변경이 있으면 Firestore에 즉시 `setDoc`으로 재저장

### 교구 구역원 순서 뒤섞임 버그 수정 (이번 세션)
- 사용자 신고: "기존 순서는 구역장, 배우자, 권찰, 배우자, 나머지 가나다순 이었는데 지금은 뒤죽박죽" — systematic-debugging으로 git log 추적하여 근본 원인 2곳 발견
  - `RosterZoneEditor.tsx`의 `handleAdd`가 구역원 추가 시 전체 배열을 무조건 가나다순 재정렬 (구역장/권찰 위치까지 깨짐) → 구역장/권찰은 위치 유지, 나머지만 정렬하도록 수정
  - `App.tsx`의 `syncReportFromRoster`가 교구 zone 멤버를 보고서 생성 시마다 무조건 `sort(byKo)` 재정렬 → 제거하여 roster 저장 순서를 그대로 권위로 사용하도록 수정
- 주의: 이 수정은 향후 재발만 막을 뿐, 이미 Firestore에 저장된 잘못된 순서 자체는 복구하지 않음 (그래서 위 6구역 전용 마이그레이션이 별도로 필요했음)

### 별명부 날짜 인식 동기화 (이번 세션)
- 사용자 신고: 별명부로 이동하면 과거 보고서에서도 소급 제외되는 데이터 무결성 문제. 요구사항: "과거 기록은 유지, 변경한 날 부터 적용"
- `App.tsx`의 `syncReportFromRoster(report, roster, reportDate?)`에 `reportDate` 파라미터 추가 — `movedAt.slice(0,10) > reportDate`인 별명부 멤버는 해당 보고서에 한해 원래 구역(`fromZoneId`)으로 복원 후 동기화
- 호출부(`handleRosterChange`, `handleLoadReport`, `loadCloudData`) 모두 `reportDate` 전달하도록 수정

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
- 별명부 항목 정렬 (사유별, 이름별)
- 구역 추가/삭제/이름 변경 기능 (현재는 기본 12구역 고정)
- 다른 구역(1~5, 7~12구역)도 순서 이상 여부 확인 필요 시 `fixZone6MemberOrder`와 동일한 패턴으로 개별 마이그레이션 함수 추가 가능
- `fixZone6MemberOrder`는 1회성 데이터 교정용 코드이므로, 모든 사용자의 앱이 로드되어 Firestore가 정상 순서로 저장된 것이 확인되면 추후 제거 검토 가능 (단, 서두르지 말 것 — 완전히 배포/확인 후에만)

## 빌드 & 배포
```bash
npm run build          # TypeScript 체크 + Vite 빌드
npm test               # Vitest 단위 테스트
firebase deploy        # Firebase Hosting 배포 (firebase CLI 필요)
```
