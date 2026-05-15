# ministry-report-v2 — Codex Handoff (v2.5.2)

## 현재 상태
- 최신 커밋: `5b62f5d feat(mobile): 최고관리자 모바일 보고서 삭제 기능 + v2.5.2`
- 브랜치: `main` (origin/main 동기화 완료)
- 버전: 2.5.2

## 방금 수정한 내용

### v2.5.2 — 모바일 보고서 삭제 기능 (최고관리자 전용)
- **문제**: 모바일에서 저장된 보고서를 삭제할 수 없었음
- **해결**:
  - `src/features/report/MobileReportList.tsx`: `canDelete`/`onDelete` prop 추가, `isEditing` state, 편집/완료 토글 버튼, 카드 좌측 삭제 버튼 (쓰레기통 아이콘), `window.confirm` 삭제 확인
  - `src/App.tsx`: `canDelete={isSuperAdmin(currentAccount)}`, `onDelete={(r) => void handleDeleteReport(r)}` 연결
  - `src/styles.css`: 편집 모드 CSS 추가 (`.mobile-report-section-header`, `.mobile-report-edit-toggle`, `.mobile-report-card-row`, `.mobile-report-delete-btn`)

### v2.5.1 이전 세션 수정 내용
- 열람자(viewer) RBAC 권한 버그 수정 (AppModeToggle, 데이터 패널 차단)
- iPad에서 `.desktop-only` CSS 중복 렌더링 버그 수정 (`pointer: fine` 조건 추가)
- 최고관리자가 뷰어 모드에서 작성/수정 버튼 보이는 버그 수정
- 보고자 이름이 현재 로그인 계정명으로 항상 업데이트되도록 수정
- TabbedReportForm에서 보고자 입력 필드 제거
- info-row 레이아웃: 데스크탑 `2fr 1fr`, 모바일 단일 컬럼

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **스타일**: 전역 `src/styles.css` (CSS Variables, 다크모드 지원)
- **빌드**: `npm run build`
- **테스트**: `npm test` (Vitest, 31 tests)
- **배포**: GitHub Actions → GitHub Pages (push to main 시 자동)

## 주요 파일
| 파일 | 역할 |
|------|------|
| `src/App.tsx` | 앱 루트, RBAC, 모바일/데스크탑 레이아웃 분기 |
| `src/features/report/MobileReportList.tsx` | 모바일 보고서 목록 + 편집 모드 삭제 |
| `src/features/report/TabbedReportForm.tsx` | 탭 기반 보고서 편집폼 |
| `src/features/auth/UserManagementPanel.tsx` | 유저 관리 UI (슈퍼어드민 전용) |
| `src/features/auth/useAccounts.ts` | 계정/권한 관리, isSuperAdmin() |
| `src/domain/reportTypes.ts` | MinistryReport 타입 정의 |
| `src/styles.css` | 전역 스타일시트 |

## 다음으로 할 수 있는 작업
- 삭제 후 토스트 알림 (현재는 confirm만)
- Firestore Security Rules에 RBAC 반영 (현재 프론트엔드 전용)
- 보고서 일괄 삭제 기능

## 빌드 & 배포
```bash
npm run build         # Vite 빌드
npm test              # 테스트 실행
git push origin main  # GitHub Pages 자동 배포
```
