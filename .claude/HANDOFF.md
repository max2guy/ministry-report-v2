# ministry-report-v2 — Codex Handoff (v2.4.15)

## 현재 상태
- 브랜치: `main`
- 최신 작업: Firestore undefined 필드값 sanitize + 저장 실패 에러 메시지 개선 (v2.4.15)

## 방금 수정한 내용

### 문제
모바일에서 보고서 저장 시 "저장 실패. 네트워크를 확인해 주세요." 에러 발생.
실제 원인: Firestore는 `undefined` 필드값을 거부함.
`createEmptyReport()`에서 일부 필드가 undefined로 생성될 수 있었음.

### 해결 방법

**1. `src/storage/firestoreReportStore.ts`**
- `sanitize<T>()` 함수 추가: `JSON.parse(JSON.stringify(data))`로 undefined 필드 제거
- `firestoreSaveReport()`, `firestoreSaveReports()` 모두 저장 전에 `sanitize()` 적용

**2. `src/App.tsx`**
- `handleSave()` catch 블록에서 실제 에러 메시지를 표시 (`err.message`)
- 모바일 저장 상태 표시용 `<p className="mobile-save-status">` 추가 (사이드바 display:none 우회)

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth (Google OAuth) + Firestore
- **스타일**: 순수 CSS (CSS 변수 기반 테마)
- **빌드**: `npm run build`
- **로컬 개발**: `npm run dev` (localhost:5173, SW 비활성화)
- **배포**: GitHub Actions → GitHub Pages (main 브랜치 push 시 자동)

## 주요 파일
```
src/
  App.tsx                          # 메인 앱 상태관리 + 핸들러
  styles.css                       # 전체 CSS (CSS 변수 기반)
  domain/reportTypes.ts            # 타입 정의 + createEmptyReport()
  storage/
    firestoreReportStore.ts        # Firestore 보고서 CRUD (sanitize 포함)
    firestoreRosterStore.ts        # Firestore 명부 CRUD (dedup 포함)
  auth/
    firebaseAuthStore.ts           # Google 로그인, 사용자 문서 관리
    authTypes.ts                   # Account, UserRole 타입
  features/
    report/
      TabbedReportForm.tsx         # 보고서 작성 폼 (탭 방식)
      ReportViewer.tsx             # 보고서 뷰어
      MobileReportList.tsx         # 모바일 보고서 목록
    auth/
      ReporterAccountPanel.tsx     # 계정/설정 패널 (이름 변경 포함)
    nav/
      BottomTabBar.tsx             # 하단 탭 내비게이션
```

## 알려진 이슈 / 다음 작업 후보
- 보고서 목록 날짜 역순 정렬 (최신이 위) 미구현
- 보고서 삭제 기능 미구현
- 오프라인 저장 → 온라인 복구 sync 미구현

## 빌드 & 배포
```bash
npm run build        # 프로덕션 빌드 (dist/)
npm run dev          # 개발 서버 (localhost:5173)
git push origin main # GitHub Pages 자동 배포 트리거
```

## Service Worker 주의사항
- 개발 환경에서 SW 등록 금지 (vite.config.ts devOptions.enabled: false)
- 사용자 기기 구버전 캐시 → "강제 새로고침" 버튼 사용
