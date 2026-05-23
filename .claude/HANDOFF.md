# ministry-report-v2 — Codex Handoff (v2.7.4)

## 현재 상태
- 브랜치: main
- 버전: 2.7.4
- 최신 커밋: (v2.7.4 커밋 예정)

## 방금 수정한 내용

### 문제
모바일 편집 폼에서 보고일/제목 영역이 독립 흰 카드로 스타일링되어
부서별 보고 섹션과 시각 언어가 달라 폼이 분리되어 보였음.

### 해결

#### src/styles.css (base 스타일 — 모바일 기준)
- `.info-fields-row`: 카드 컨테이너 제거 → flex row, gap: 8px, 배경 없음
- `.info-field-label`: department-list li 동일 스타일
  (bg: clr-bg, border: 1px solid clr-border-soft, border-radius: 8px, padding: 10px 12px, min-height: 52px, flex: 1)
- `.info-field-label input`: border/bg 제거, transparent, color: primary, bold
- `.info-fields-heading` 추가: department-section h3 동일 스타일 (13px, bold, clr-text-secondary)

#### src/styles.css (데스크탑 미디어쿼리 @media min-width 821px)
- `.info-fields-heading { display: none }` — 모바일 전용 헤더 숨김
- `.info-fields-row`: 원래 컨테이너 카드 스타일 복원 (padding: 12px 16px, bg: clr-card-bg, border-radius: 14px, box-shadow)
- `.info-field-label`: flex: unset, border: none, padding: 0 등 리셋
- `.info-field-label input`: 원래 border/bg 복원

#### src/features/report/TabbedReportForm.tsx
- `info-fields-row` 위에 `<h3 className="info-fields-heading">기본정보</h3>` 추가

## 직전 주요 작업 (v2.7.3)
- 보고서 목록 항목별 독립 카드 분리 (`.mobile-report-card-row`에 카드 스타일 이동)

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
- `src/features/report/TabbedReportForm.tsx` — 편집 폼 (기본정보 탭)
- `src/features/report/MobileReportList.tsx` — 보고서 목록
- `src/App.tsx` — 앱 루트, 헤더/viewer-tab-bar 구조

## CSS 구조 주의사항
- base 스타일(미디어쿼리 없음): 모바일 기준값 — `info-fields-*` 는 여기서 모바일 카드 스타일
- `@media (min-width: 821px) and (pointer: fine)`: 데스크탑 오버라이드 — 반드시 원래 데스크탑 스타일 유지
- `@media (max-width: 820px), (pointer: coarse)`: 모바일 추가 오버라이드 (헤더, 레이아웃 등)

## 다음으로 할 수 있는 작업
- 기기 검증: 모바일에서 기본정보/부서별 보고 시각 통일 확인
- 모바일 헤더 `--layer2-h: 36px` 실제 탭바 높이 기기 확인 후 조정

## 빌드 & 배포
```bash
npm run build
npm run dev         # localhost:5173
firebase deploy --project <project-id>
```
