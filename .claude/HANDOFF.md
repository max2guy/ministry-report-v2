# ministry-report-v2 — Codex Handoff (v2.7.3)

## 현재 상태
- 브랜치: main
- 버전: 2.7.3

## 방금 수정한 내용

### 문제
보고서 목록에서 항목 간 시각적 구분이 어려웠음 (하나의 흰 카드 안에 border-bottom만으로 구분).

### 해결 (src/styles.css)
- `.mobile-report-card-list`: 카드 스타일 제거 → `gap: 10px`만 유지
- `.mobile-report-card-row`: 카드 스타일(bg + border-radius: 12px + box-shadow) 이동, overflow:hidden 제거
- `.mobile-report-card`: `border-bottom` 제거, `border-radius: 12px` 추가 (active 클리핑용)
- `.mobile-report-card:last-child`: 규칙 삭제 (불필요)
- `.mobile-report-card-row.is-editing`: `gap: 8px; padding: 6px 0 6px 12px` 추가 (편집 모드 삭제 버튼 여백)

## 직전 주요 작업 (v2.7.2)
- 모바일 헤더 2단 분리: ResizeObserver 제거, CSS 상수(--layer1-h, --layer2-h) 기반으로 교체
- viewer-tab-bar를 header 밖으로 분리

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: src/styles.css (단일 CSS 파일)
- **인증/DB**: Firebase Auth + Firestore + FCM
- **빌드**: `npm run build` (Vite + Workbox PWA)
- **개발 서버**: `npm run dev` (localhost:5173, SW 등록 없음)

## 주요 파일
- `src/styles.css` — 전체 스타일시트
- `src/features/report/MobileReportList.tsx` — 보고서 목록 컴포넌트
- `src/App.tsx` — 앱 루트, 헤더/viewer-tab-bar 구조

## 다음으로 할 수 있는 작업
- 기기 검증: 모바일에서 카드 분리 확인, 편집 모드(삭제 버튼) 레이아웃 확인
- 편집 폼 레이아웃 개선 (보고일/제목 카드 ↔ 부서별 보고 섹션 분리/통합) — 논의 중
- 모바일 헤더 `--layer2-h: 36px` 실제 탭바 높이 기기 확인 후 조정

## 빌드 & 배포
```bash
npm run build
npm run dev         # localhost:5173
firebase deploy --project <project-id>
```
