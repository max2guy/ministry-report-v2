# ministry-report-v2 — Codex Handoff (v2.7.11)

## 현재 상태
- 브랜치: `main`
- 버전: 2.7.11

## 방금 수정한 내용

### 다기기 출결 동기화 버그 수정 (draft 우선순위 오류)

- **파일**: `src/App.tsx` (257번째 줄 근처 `loadCloudData` 함수)
- **문제**: 모바일에서 출결 체크 후 Firestore 저장 → 데스크탑에서 열면 출결이 0으로 표시됨
- **근본 원인**: `const initialReport = draft ?? latest;` — localStorage draft가 항상 Firestore 데이터보다 우선됨. 데스크탑의 draft는 출결 입력 이전에 저장된 오래된 상태
- **수정**:
  - 같은 보고서 ID일 때 `updatedAt` 타임스탬프를 비교하여 더 최신 버전 사용
  - 다른 기기에서 저장 후 열기 → Firestore 버전(더 최신) 우선
  - 같은 기기에서 미저장 편집 중 → draft(더 최신) 유지
  - 완전히 다른 보고서 draft → 기존 동작 그대로

```typescript
// 수정 전 (버그)
const initialReport = draft ?? latest;

// 수정 후
const initialReport =
  draft && latest && draft.id === latest.id
    ? draft.updatedAt > latest.updatedAt
      ? draft
      : latest
    : (draft ?? latest);
```

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript PWA
- **인증/DB**: Firebase Auth + Firestore + FCM
- **스타일**: 단일 파일 `src/styles.css` (모바일 기본, `@media (min-width: 821px)` 데스크탑 오버라이드)
- **빌드**: `npm run build`
- **배포**: GitHub Actions → GitHub Pages (`https://max2guy.github.io/ministry-report-v2/`)
- **테스트**: `npm test` (vitest, 34개 테스트)

## 주요 파일
- `src/App.tsx` — 루트 컴포넌트, `loadCloudData()` 함수에 draft/cloud 우선순위 로직
- `src/storage/reportDraftStore.ts` — localStorage draft 읽기/쓰기 (`"ministry-report-v2-current-draft"` 키)
- `src/styles.css` — 전체 스타일 (단일 파일)
- `src/features/report/SmsPanel.tsx` — 문자 발송 패널 (모바일+데스크탑 지원)
- `src/features/report/DepartmentAttendanceEditor.tsx` — 유초등부/중고등부/청년부 출결 카드 UI

## 다음으로 할 수 있는 작업
- 중고등부 통계 색상 변경 여부 결정 (보류 중)
- SMS 자동 발송 자동화 (Playwright 활용, 보류 중)
- 기타 UX 개선

## 빌드 & 배포
```bash
npm run build
npm test
git push origin main  # GitHub Actions 자동 배포
```
