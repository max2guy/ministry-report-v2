# ministry-report-v2 — Codex Handoff (v2.4.22)

## 현재 상태
- 브랜치: `main`
- 최신 배포 기준: `v2.4.22`
- 최신 커밋: 작업 중

## 최근 버전 흐름
- `v2.4.22`
  - 헤더 상단 글씨 블록을 조금 아래로 내려 균형 조정
  - 모바일 부서 섹션 스크롤 시 헤더 높이가 꿀렁이던 현상 완화
  - `ResizeObserver` 기반 실시간 높이 추적을 제거하고, 헤더 구조가 바뀌는 시점에만 `--top-bar-height` 재계산
- `v2.4.21` `f7d4252`
  - 모바일 뷰어 헤더를 처음부터 컴팩트 상태로 고정
  - 모바일 `.top-bar` 패딩, 액션 간격, 아바타 크기, 뷰어 탭 간격 축소
  - `--top-bar-height` fallback 값을 낮춰 첫 진입 하단 빈 공간 축소
- `v2.4.20` `d82e9de`
  - 헤더-카드 겹침 해결
  - `useLayoutEffect` + `ResizeObserver`로 실제 고정 헤더 높이를 `--top-bar-height`에 반영
  - fallback 높이 증가로 겹침 방지
- `v2.4.19` `190e366`
  - 연속결석 정렬 개선
  - 이름 교정: `윤승희 -> 윤승휘`
- `v2.4.18` `916808b`
  - 모바일 뷰어 탭바를 스크롤 콘텐츠가 아니라 고정 헤더 내부로 통합
- `v2.4.17` `59359c4`
  - 구버전 보고서 로드 시 `summary` 등 누락 필드 정규화

## 이번 작업에서 실제 수정한 파일
- `src/App.tsx`
  - 모바일 헤더 높이 계산을 상태 전환형으로 변경
- `src/styles.css`
  - 헤더 상단 글씨 블록 하향 조정
- `package.json`
  - 버전 `2.4.21 -> 2.4.22`

## 프로젝트 개요
- **프레임워크**: React 19 + TypeScript + Vite PWA
- **인증/DB**: Firebase Auth + Firestore
- **스타일**: 순수 CSS
- **배포**: GitHub Actions -> GitHub Pages (`main` push 시 자동 배포)

## 주요 파일
```txt
src/
  App.tsx
  styles.css
  auth/
    firebaseAuthStore.ts
    authTypes.ts
  domain/
    reportTypes.ts
    memberRoster.ts
  storage/
    firestoreReportStore.ts
    firestoreRosterStore.ts
  features/
    report/
      TabbedReportForm.tsx
      ReportViewer.tsx
      MobileReportList.tsx
    auth/
      ReporterAccountPanel.tsx
    nav/
      BottomTabBar.tsx
```

## 현재 주의사항
- `npm run build`는 통과함
- `npm run smoke` / `npm run verify`는 현재 실패함
- 실패 원인은 이번 `v2.4.21` 헤더 수정 자체보다는, **현재 앱 UI와 Playwright smoke 기대치가 어긋난 상태**로 보임

### 확인된 smoke 불일치 예시
- 인증 진입 테스트:
  - 테스트는 `사역보고서 v2`, `로그인` heading, `계정 생성` 탭 존재를 기대
  - 실제 `v2.4.20+` UI와 불일치 가능성 큼
- PWA 메타 테스트:
  - 테스트는 `/icon.svg` 기반 아이콘을 기대
  - 실제 manifest는 png 아이콘 배열 반환
- 후속 테스트들:
  - 초반 auth gate 기대치가 어긋나면서 연쇄 timeout 발생

## 다음 작업 추천
1. 실제 `v2.4.21` UI 기준으로 smoke 테스트 기대치 갱신
2. auth gate / PWA metadata / 뷰어 인쇄 흐름부터 순차 복구
3. 그 다음 `npm run verify` 다시 녹색화

## 빌드 & 배포
```bash
npm run build
npm run dev
git push origin main
```

## Service Worker / 캐시 메모
- 개발 환경에서 SW 등록 금지
- 구버전 캐시 이슈가 남아 있을 수 있으니, 사용자 단말에서 이상하면 강제 새로고침 유도
