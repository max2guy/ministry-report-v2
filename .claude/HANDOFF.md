# ministry-report-v2 — Codex Handoff (v2.7.5)

## 현재 상태
- 브랜치: main
- 버전: 2.7.5
- 최신 커밋: 79bcf95 fix(ui): date-nav 버튼-label 충돌 방지 + formatReportDate 빈값 가드

## 방금 수정한 내용

### 문제
모바일에서 보고일 `<input type="date">` 사용 시 OS 날짜 피커가 열려 주일 날짜를 빠르게 선택하기 불편했음.

### 해결

#### src/features/report/TabbedReportForm.tsx
- 날짜 헬퍼 함수 추가: `localDateStr`, `formatReportDate` (빈값 가드 포함), `shiftWeek`, `getThisSunday`
- 핸들러 추가: `handlePrevWeek` (-7일), `handleNextWeek` (+7일), `handleThisSunday` (이번 주일)
- 보고일 `<label>` → `<div className="info-field-label">` 교체 (버튼-label 충돌 방지)
- 내부: `<div class="date-nav-row">`(‹ 날짜 ›) + sr-only label + `<input id="report-date-input" class="date-native-input">` (데스크탑 전용)
- `info-fields-row` 아래 `<button class="date-this-sunday-btn">이번 주일</button>` 추가

#### src/styles.css
- base 블록: `.date-nav-row`, `.date-nav-btn` (min 44×44px 터치 영역, :active 피드백), `.date-nav-display` 스타일 추가
- base 블록: `.date-native-input { display: none }` (모바일 기본 숨김)
- base 블록: `.date-this-sunday-btn` 스타일 추가
- base 블록: `.sr-only` 접근성 유틸 추가
- 데스크탑 미디어쿼리: `.date-nav-row, .date-this-sunday-btn { display: none }`, `.date-native-input { display: block }` 추가
- 모바일 섹션: `.info-fields-row { margin-bottom: 8px }`, `.date-this-sunday-btn { margin-bottom: 16px }` 추가

## 직전 주요 작업 (v2.7.4)
- 모바일 기본정보 섹션 정렬·간격 수정 (패딩 12px, 헤딩 margin-bottom: 10px)
- TabbedReportForm에 "기본정보" 섹션 헤더 추가

## 프로젝트 개요
- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: src/styles.css (단일 CSS 파일)
- **인증/DB**: Firebase Auth + Firestore + FCM
- **빌드**: `npm run build` (Vite + Workbox PWA)
- **개발 서버**: `npm run dev` (localhost:5173, SW 등록 없음)

## 주요 파일
- `src/styles.css` — 전체 스타일시트
- `src/features/report/TabbedReportForm.tsx` — 편집 폼 (기본정보 탭, 날짜 네비게이션)
- `src/features/report/MobileReportList.tsx` — 보고서 목록
- `src/App.tsx` — 앱 루트

## CSS 구조 주의사항
- base 스타일(미디어쿼리 없음): 모바일 기준값 — `.date-nav-*`은 여기서 표시
- `@media (min-width: 821px) and (pointer: fine)`: 데스크탑 — `.date-nav-*` 숨김, `.date-native-input` 표시
- `@media (max-width: 820px), (pointer: coarse)`: 모바일 추가 오버라이드

## 날짜 네비게이션 로직
- `shiftWeek(iso, delta)`: `new Date(iso + "T00:00:00")` 로컬 자정 기준, `delta * 7`일 이동
- `getThisSunday()`: `d.setDate(d.getDate() - d.getDay())` (getDay()=0이 일요일)
- `localDateStr(d)`: `toISOString()` 대신 로컬 날짜 직접 포맷 (KST 타임존 안전)
- `formatReportDate(iso)`: 빈값/malformed 가드 포함 → `"2026-05-17"` → `"2026. 05. 17."`

## 다음으로 할 수 있는 작업
- 기기 검증: ‹/› 7일 이동, 이번 주일 버튼 동작 확인 (모바일)
- 데스크탑: 기존 date input 정상 동작 확인
- 모바일 헤더 `--layer2-h: 36px` 실제 탭바 높이 기기 확인 후 조정

## 빌드 & 배포
```bash
npm run build
npm run dev         # localhost:5173
firebase deploy --project <project-id>
```
