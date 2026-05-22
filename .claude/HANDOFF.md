# ministry-report-v2 — Codex Handoff (v2.7.3)

## 현재 상태
- 브랜치: main
- 버전: 2.7.3
- 최신 커밋: cd3ff64 — feat(ui): 모바일 기본정보 필드 — department-list 스타일로 통합

## 방금 수정한 내용

### 문제
편집 화면의 보고일/제목 입력 필드가 별도 카드 스타일로 부서별 보고(department-list) 항목과 시각적으로 불일치.

### 해결 (src/styles.css — commit cd3ff64)
- `.info-fields-row`: 래퍼 카드 제거 → `flex-direction: row; gap: 8px; background: transparent; box-shadow: none`
- `.info-field-label`: `flex: 1` + department-list 아이템과 동일한 카드 스타일(border, border-radius: 8px, padding, min-height: 52px)
- `.info-field-label input`: 내부 border 제거, `background: transparent; color: var(--clr-primary)` — 카드 안 인라인 텍스트처럼
- `.info-fields-heading` 추가: 모바일 전용 섹션 헤더 (font-weight: 700, font-size: 13px)
- 데스크탑 미디어쿼리: `.info-fields-heading { display: none }` 추가

## 직전 주요 작업 (v2.7.2~)
- 보고서 목록 카드 시각 분리: `.mobile-report-card-row`에 카드 스타일 이동, `gap: 10px`
- 모바일 헤더 2단 분리: ResizeObserver 제거, CSS 상수 기반으로 교체

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
