# ministry-report-v2 — Codex Handoff (v2.7.9)

## 현재 상태
- 브랜치: `main`
- 버전: 2.7.9

## 방금 수정한 내용

### 데스크탑 SMS 발송 지원
- **파일**: `src/features/report/SmsPanel.tsx`, `src/styles.css`, `src/features/report/smsUtils.test.ts`
- **문제**: 기존에는 `isMobile()` 검사로 데스크탑에서 문자 발송이 완전 차단됨
- **수정**:
  - `openSms()` 플랫폼 분기: 모바일 → `sms:` URL 유지, 데스크탑 → `navigator.clipboard.writeText(msg)`
  - `copiedId` 상태로 항목별 복사 완료 피드백 (1.5초 자동 해제)
  - 패널 상단에 "🌐 Google Messages" 버튼 추가 (데스크탑 전용, `_blank` 탭)
  - 각 항목 헤더에 전화번호 표시 (데스크탑 전용, `sms-phone-display` 클래스)
  - confirm-bar 안내 문구 모바일/데스크탑 분기
  - 버튼 라벨: 데스크탑 "📋 메시지 복사" / 모바일 "📨 문자앱 열기"
  - `isMobile()` 단위 테스트 3개 추가 (Android/iPhone/MacOS UA)

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript PWA
- **인증/DB**: Firebase Auth + Firestore + FCM
- **스타일**: 단일 파일 `src/styles.css` (모바일 기본, `@media (min-width: 821px)` 데스크탑 오버라이드)
- **빌드**: `npm run build`
- **배포**: GitHub Actions → GitHub Pages (`https://max2guy.github.io/ministry-report-v2/`)
- **테스트**: `npm test` (vitest, 34개 테스트)

## 주요 파일
- `src/App.tsx` — 루트 컴포넌트, 인증 상태 관리
- `src/styles.css` — 전체 스타일 (단일 파일)
- `src/features/report/SmsPanel.tsx` — 문자 발송 패널 (모바일+데스크탑 지원)
- `src/features/report/smsUtils.ts` — 메시지 내용 생성 + isMobile()
- `src/features/auth/AuthGate.tsx` — 로그인 화면
- `src/features/pwa/InstallGuideBanner.tsx` — PWA 설치 안내

## 다음으로 할 수 있는 작업
- 중고등부 통계 색상 변경 여부 결정 (보류 중)
- 기타 UX 개선

## 빌드 & 배포
```bash
npm run build
npm test
git push origin main  # GitHub Actions 자동 배포
```
