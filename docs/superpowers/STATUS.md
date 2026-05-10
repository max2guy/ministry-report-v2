# Ministry Report v2 — Current Status

**Last updated:** 2026-05-07  
**Last worked by:** Codex + Claude Code (handoff session)

---

## 프로젝트 위치

```
~/Documents/New project/Projects/ministry-report-v2
```

레거시 앱 (참조용, 수정 금지):
```
~/Projects/report-app
```

레거시 데이터 파일:
```
~/Projects/report-app/history.json   ← 2026-02-01~2026-04-26, 13개 보고서
```

---

## 구현 완료 범위

### 메인 플랜 (2026-04-30-ministry-report-v2.md)
Tasks 1–67 전부 완료. 커밋: `167977e feat: build ministry report v2`

### 출석 카드 에디터 (2026-05-07-attendance-card-editor.md)
전부 구현 완료. 계획 파일 체크박스 업데이트 완료.

- `DepartmentMember` 타입 추가 (`members?: DepartmentMember[]` 옵셔널)
- `src/domain/reportMembers.ts` — `hasMemberCards`, `toggleDepartmentMember`, `addDepartmentMember`, `deriveAttendanceFromMembers`
- `src/features/report/DepartmentAttendanceEditor.tsx` — 카드 토글 UI
- `src/features/report/LegacyDepartmentAttendanceEditor.tsx` — import된 숫자형 데이터 폴백
- `createEmptyReport()` → `churchName: "연천장로교회"` 고정, 유초등부에 `["권상우", "천주아"]` 기본 시드
- `src/domain/reportImport.ts` → `members` 배열 보존

### 인증 진입 화면 (2026-05-07-auth-entry-screen.md)
전부 구현 완료. 계획 파일 체크박스 업데이트 완료.

- `src/features/auth/AuthGate.tsx` — 로그인 / 계정 생성 / 계정 찾기 탭
- `src/features/auth/AccountLookupForm.tsx` — 이름+이메일 매칭, 마스킹 표시
- `src/auth/internalAuthStore.ts` → `findAccountByNameAndEmail`, `maskEmail` 추가
- `App.tsx` → 비로그인 상태에서 `AuthGate` 렌더링, 로그인 후 에디터 진입

---

## 검증 결과 (2026-05-07 기준)

```
npm run verify
```

- 단위 테스트: 22/22 PASS
- 빌드: PASS
- Playwright 스모크: 43/43 PASS

---

## 레거시 데이터 import 안내

**자동 import 없음.** 사용자가 수동으로 UI에서 import해야 함:

1. 앱 실행: `npm run dev` 또는 `npm run preview`
2. 계정 생성 후 에디터 화면 진입
3. 사이드바 "기존 JSON" 파일 선택
4. `~/Projects/report-app/history.json` 업로드
5. 13개 보고서가 v2 스키마로 변환됨 (elementary는 `attendance: 0`으로 생성되고 warning 발생 — 정상)

---

## 알려진 제약

- 모든 데이터는 **브라우저 IndexedDB에만** 저장됨. 기기 간 공유 없음.
- 백업: 사이드바 "전체 백업" → `*-ministry-report-v2-backup.json` 다운로드
- Word 문서 생성, NAS 업로드 기능 없음 (의도적 제외)
- 비밀번호: SHA-256 해시 저장. 이메일 발송 없음.
- 임시 비밀번호 발급 후 로그인 시 → 비밀번호 변경 강제 → 변경 전 저장 불가

---

## 다음 작업 후보 (우선순위 없음)

아래 항목들은 아직 계획/구현 없음. 필요시 새 플랜 파일 작성 후 진행:

- 유초등부 외 부서에도 기본 멤버 시드 추가
- 멤버 삭제 기능
- 멤버 이름 수정 기능
- 다음 주 계획 / 기도 / 일반 의견 필드 (레거시 앱에 있던 필드)
- 부서별 헌금 분리 (현재는 전체 헌금 하나만 있음)

---

## 주요 파일 구조

```
src/
  App.tsx                          — 앱 진입, 계정 상태로 AuthGate/에디터 분기
  auth/
    authTypes.ts                   — Account, UserRole, AccountStatus
    emailValidation.ts             — 이메일 정규화 및 검증
    internalAuthStore.ts           — IndexedDB 계정 CRUD, 비밀번호 해싱
  domain/
    reportTypes.ts                 — MinistryReport, DepartmentReport, DepartmentMember
    reportMembers.ts               — 카드 헬퍼 함수
    reportMigrations.ts            — 레거시 JSON → v2 변환
    reportImport.ts                — v2 단일/배열/백업 번들 파싱
    reportBackup.ts                — 전체 백업 번들 생성
    reportValidation.ts            — 저장 전 필수 필드 검증
  features/
    auth/
      AuthGate.tsx                 — 비로그인 진입 화면 (탭 구조)
      AccountLookupForm.tsx        — 계정 찾기 폼
      SignInForm.tsx               — 로그인 폼
      SignUpForm.tsx               — 계정 생성 폼
      ReporterAccountPanel.tsx     — 로그인 상태 계정 패널 + 비밀번호 변경
      PasswordChangePanel.tsx      — 임시비밀번호 변경 폼
    admin/
      AdminRecoveryManager.tsx     — 관리자 복구 계정 선택
      AdminRecoveryPanel.tsx       — 임시 비밀번호 설정 폼
    report/
      ReportEditor.tsx             — 에디터 레이아웃
      ReportForm.tsx               — 보고서 입력 폼
      ReportCanvas.tsx             — 보고서 렌더러 (에디터/뷰어 공유)
      ReportViewer.tsx             — 읽기 전용 뷰어 + 인쇄
      ReportHistoryPanel.tsx       — 저장 목록, 검색, 필터, 백업
      DepartmentAttendanceEditor.tsx      — 카드형 출석 에디터
      LegacyDepartmentAttendanceEditor.tsx — 숫자형 폴백
    import/
      LegacyImportPanel.tsx        — JSON 파일 import UI
  storage/
    reportStore.ts                 — IndexedDB 보고서 CRUD
    reportDraftStore.ts            — localStorage 임시 저장
```
