# ministry-report-v2 — Codex Handoff (v2.4.4)

## 현재 상태

최신 커밋: `fix(settings): 계정 탭 → 설정 탭, 테마 카드 스타일 (v2.4.5)` (`bd98c2a`)
브랜치: `main` (GitHub Pages 자동 배포) — v2.4.5

## 방금 수정한 내용 (v2.4.4)

### 1. 새 보고서 생성 시 그룹 배정 버그 수정
- **파일**: `src/domain/reportTypes.ts`
- **문제**: `createEmptyReport()`에서 roster → report 멤버 복사 시 `group` 필드 누락
- **증상**: 유초등부에서 유치부/초등부가 나뉘어 있는데 모든 인원이 유치부에 몰림 (중고등부, 청년부도 동일)
- **수정**: 세 부서 모두 `group: m.group` 추가

### 2. 교구 명단 중복 방지
- **파일**: `src/storage/firestoreRosterStore.ts`
- **문제**: Firestore에 저장된 roster에 구역이 중복돼 인원이 358명으로 부풀림
- **수정**: `firestoreLoadRoster()` 로드 시 구역 이름 기준 dedup 적용

### 3. "요약" → "종합의견 및 특이사항"
- **파일**: `src/features/report/TabbedReportForm.tsx`

### 4. 계정 이름 변경 기능 추가
- **파일**: `src/features/auth/ReporterAccountPanel.tsx`, `src/App.tsx`
- 계정 패널에 "이름 변경" 버튼 추가
- `updateDisplayName()` 호출 후 `currentAccount.displayName` 및 현재 보고서 `pastorName` 자동 동기화

### 5. 뷰어 교구 탭 "장년" → "교구" 표시
- **파일**: `src/features/report/AdultStatsPanel.tsx`, `src/features/report/ReportViewer.tsx`
- `label` prop 추가 → `label ?? dept.name` 으로 표시
- `ReportViewer`에서 `label="교구"` 전달

### 6. 뷰어 "부서별 보고" 제목 스타일 통일
- **파일**: `src/styles.css`
- `.department-section h3`: `dstats-section-title`과 동일한 폰트 적용

## 프로젝트 개요

| 항목 | 값 |
|---|---|
| 프레임워크 | React 19 + TypeScript + Vite PWA |
| 스타일 | 단일 `src/styles.css` (CSS 변수 기반 테마) |
| 인증/DB | Firebase Auth + Firestore |
| 빌드 | `npm run build` (tsc --noEmit && vite build) |
| 테스트 | `npm test` (vitest) |
| 배포 | GitHub Actions → GitHub Pages (main 브랜치 push 시 자동) |

## 주요 파일

```
src/
  App.tsx                              # 앱 루트. 헤더, 모바일/데스크탑 레이아웃, 전역 상태
  styles.css                           # 전체 스타일 (단일 파일)
  domain/
    reportTypes.ts                     # MinistryReport 타입 + createEmptyReport()
    memberRoster.ts                    # MemberRoster 타입 + mergeRosterFromReport()
  features/
    auth/ReporterAccountPanel.tsx      # 계정 패널 (이름 변경 기능 포함)
    report/TabbedReportForm.tsx        # 보고서 작성 폼 (탭 기반)
    report/DepartmentAttendanceEditor.tsx  # 출결 카드 에디터 (SplitDeptEditor 포함)
    report/ReportViewer.tsx            # 뷰어 + 탭 라우팅
    report/AdultStatsPanel.tsx         # 교구 통계 패널
    report/ReportCanvas.tsx            # 통합보고 캔버스
  storage/
    firestoreRosterStore.ts            # Firestore roster 로드/저장 + dedup
    firestoreReportStore.ts            # Firestore 보고서 CRUD
```

## CSS 핵심 변수

```css
--top-bar-height   /* fixed 헤더 높이 — ResizeObserver 실시간 업데이트 */
--clr-primary      /* 앱 주색상 */
--clr-text-secondary  /* 섹션 타이틀 색상 */
```

## 그룹 키 매핑 (SPLIT_CONFIG)

| 부서 | groupA (key/label) | groupB (key/label) |
|---|---|---|
| elementary | kindergarten / 유치부 | elementary / 초등부 |
| middleHigh | middle / 중등부 | high / 고등부 |
| youngAdult | college / 대학부 | worker / 직장부 |

## 탭 바 구조 (v2.4.3+)

| 위치 | 클래스 | 표시 조건 |
|---|---|---|
| 모바일 콘텐츠 (sticky) | `viewer-dept-tabs--mobile-sticky` | `max-width: 820px` |
| 데스크탑 뷰어 상단 | `viewer-dept-tabs--desktop` | `min-width: 821px` |

## 다음으로 할 수 있는 작업

- 명단 관리(RosterFlatEditor)에서 그룹 배정 UI 개선 (유치부/초등부 탭 나누기)
- 교구 중복 데이터 Firestore 자동 정리 (로드 후 dedup된 경우 저장 트리거)
- 계정 이름 변경 시 기존 저장된 보고서들의 pastorName도 일괄 업데이트 옵션
- 뷰어 탭 전환 시 스크롤 위치 초기화

## 빌드 & 배포

```bash
npm run build   # TypeScript 검사 + Vite 빌드
npm test        # 유닛 테스트 (vitest)
git push origin main  # → GitHub Actions 자동 배포
```
