# ministry-report-v2 — 작업 컨텍스트 핸드오프

> **이 파일 목적**: Claude / Codex가 세션이 바뀌어도 작업을 이어갈 수 있도록 현재 상태와 결정사항을 기록한다.  
> **업데이트**: 작업 마칠 때마다 갱신할 것.

---

## 프로젝트 개요

- **스택**: React 19 + TypeScript + Vite PWA
- **저장소 경로**: `/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2`
- **진입점**: `src/App.tsx`
- **스타일**: `src/styles.css` 단일 파일 (CSS 변수 기반 테마)
- **도메인 타입**: `src/domain/reportTypes.ts`

### 핵심 도메인 타입

```ts
DepartmentMember  { id, name, status: "present"|"absent", role?, phone?, group? }
DepartmentZone    { id, name, district: number, members: DepartmentMember[] }
DepartmentReport  { key, name, attendance, newVisitors, summary, members?, zones? }
MinistryReport    { id, reportDate, departments: Record<DepartmentKey, DepartmentReport>, ... }
DepartmentKey     = "elementary" | "middleHigh" | "youngAdult" | "adult"
```

- **flat dept** (유초등부·중고등부·청년부): `dept.members[]`
- **zoned dept** (장년/교구): `dept.zones[].members[]`, `zone.district`는 1 또는 2 (교구 번호)

---

## 테마 시스템

`data-theme` 어트리뷰트 (green / blue / orange)로 전환. 세 테마 모두 **중립 서피스** 공유:

```css
--clr-bg: #f6f6f6;
--clr-card-bg: #ffffff;
--clr-surface: #eeeeee;
--clr-border: #e4e4e4;
--clr-border-soft: #ebebeb;
```

테마별 고유 변수: `--clr-primary`, `--clr-primary-rgb`, `--clr-primary-light`, `--clr-present-bg`, `--clr-present-border`, `--clr-muted`, `--clr-text`, `--clr-text-secondary`, `--clr-text-muted`

---

## 바 차트 패턴 (중요)

그라디언트를 **트랙에 적용**하고 오른쪽 빈 부분을 overlay div로 가린다.  
→ 값이 높을수록 더 진하게 보임 (그라디언트가 트랙 전체 폭 기준이라).

```css
.sbar-track  { background: var(--clr-surface); display: flex; justify-content: flex-end; }
.sbar-primary { background: linear-gradient(to right, var(--clr-primary-light), var(--clr-primary)); }
.sbar-empty  { background: var(--clr-surface); height: 100%; flex-shrink: 0; }
```

```tsx
<div className="sbar-track sbar-primary">
  <div className="sbar-empty" style={{ width: `${100 - pct}%` }} />
</div>
```

뷰어 통계 패널 내 바는 10px 높이의 `.dstats-sbar-track` 별도 클래스 사용.

---

## 주요 UI 결정사항

| 항목 | 결정 |
|---|---|
| 서피스 배경 | 모든 테마 중립 (`#f6f6f6`, `#ffffff`) |
| 탑바 | `--clr-primary` 배경, 흰 텍스트. `margin: -24px -24px 0`으로 shell padding 상쇄 |
| 활성 탭 | `--clr-present-bg` 배경 + `--clr-primary` 텍스트/보더 |
| 히스토리 패널 카드 | 날짜 + "현재" pill만 표시 (부서 요약 없음) |
| 바 색상 | 모든 바 `sbar-primary` 단일색 (조건부 gold/red 없음) |

---

## 파일 구조 (src/features/report/)

```
AdultStatsPanel.tsx          장년 뷰어 통계 패널 (구역별 결석, 추이)
AttendanceSummaryStats.tsx   사이드바용 출결 통계 (월별/연간 탭)
DeptStatsPanel.tsx           유초등·중고등·청년 뷰어 통계 패널
ReportCanvas.tsx             인쇄용 보고서 렌더
ReportEditor.tsx             편집기
ReportHistoryPanel.tsx       저장 보고서 목록 (검색·필터·백업)
ReportViewer.tsx             뷰어 (ReportCanvas + 통계 패널)
statsUtils.ts                통계 계산 순수함수 모음
TabbedReportForm.tsx         탭 기반 편집 폼
```

---

## statsUtils.ts — 주요 함수

```ts
getAllMembers(dept)                                        // flat/zoned 통합 멤버 배열
getAbsentMembers(dept)                                    // status==="absent" 필터
getTotalCount(dept)                                       // 전체 인원수
computeConsecutiveAbsences(reports, deptKey, currentDate) // 연속결석 streak 계산
absenceStreakColorClass(streak)                           // "streak-normal"|"streak-warning"|"streak-danger"
getRecentWeeklyRates(reports, deptKey, currentDate, 8)   // 최근 8주 출석률
getMonthlyRates(reports, deptKey, currentDate)           // 월별 평균 출석률
getRecentWeeklyAbsences(reports, currentDate, 8)         // 교구: 최근 8주 결석수
getMonthlyAbsences(reports, currentDate)                 // 교구: 월별 평균 결석수
```

streak 계산 로직: `currentDate` 이하 보고서를 날짜 역순 정렬 → 현재 보고서에서 결석인 멤버마다 이전 보고서를 거슬러 올라가며 연속 결석 카운트. 해당 보고서에 멤버 ID 없으면 skip(명단에 없던 기간).

---

## ReportViewer props

```tsx
<ReportViewer report={report} reports={reports} />
```

`reports`는 App.tsx의 `useState<MinistryReport[]>` 전체 배열.  
뷰어는 현재 보고서 날짜 이하의 보고서만 필터해서 통계 계산.

---

## CSS 클래스 네이밍 규칙

- `.dstats-*` — 뷰어 통계 패널 전용
- `.sbar-*` — 바 차트 공통
- `.stat-*` / `.srow-*` — 사이드바 AttendanceSummaryStats 전용
- `.history-*` — 히스토리 패널
- `.viewer-*` — 뷰어 레이아웃

---

## 현재 완료된 작업

- [x] 모든 `background: #ffffff` → CSS 변수로 교체
- [x] 탑바 테마 컬러 적용
- [x] 활성 탭 시각적 구분
- [x] 바 차트 그라디언트 방향 수정 (높을수록 진하게)
- [x] 모든 테마 서피스를 중립색으로 통일
- [x] 히스토리 패널 단순화 (날짜 + 현재 pill만)
- [x] 뷰어 통계 패널 구현 (DeptStatsPanel, AdultStatsPanel, statsUtils)
- [x] 뷰어 통계 그리드 2열 정렬 (데스크탑 2열, 모바일 1열)

## 다음 작업 후보 (우선순위 미정)

- [ ] 인쇄 스타일 점검 (통계 패널 print 대응)
- [ ] 뷰어 통계 패널 — 데이터 없을 때 빈 상태 처리 개선
- [ ] 장년 교구 구역별 결석 UI 세부 조정
- [ ] 전체적인 접근성(aria) 점검

---

## ⚠️ 운영 주의사항 (2026-05-09 사고 기록)

### Service Worker 관련

- **절대 dev 모드에서 SW 등록하지 말 것**. `src/main.tsx`에 이미 적용됨:
  ```ts
  if (import.meta.env.PROD) { /* SW 등록 */ }
  else { /* 기존 SW 전부 unregister */ }
  ```
- SW 캐시 이름 변경 시 (`sw.js` CACHE_NAME) 반드시 버전 올리고 activate에서 clients reload 처리.
- dev 서버(5173)에서 앱이 구버전처럼 보이면 **SW 캐시 문제**를 먼저 의심할 것. 파일 자체는 멀쩡함.

### IndexedDB 오리진 격리

- `localhost:5173` ≠ `localhost:4174` ≠ `127.0.0.1:4174` — **포트와 호스트가 다르면 완전히 별개의 DB**.
- 개발은 **항상 `localhost:5173`에서만** 한다. preview(`4173`/`4174`)나 `127.0.0.1`에서 데이터 입력하면 dev 서버에서 보이지 않음.
- vite preview는 빌드 검증용으로만 사용. 실데이터 입력 금지.

### 데이터 복구 절차 (긴급 시)

1. 데이터가 사라진 것처럼 보이면 실제 DB 위치 확인:
   ```bash
   du -sh ~/Library/Application\ Support/Google/Chrome/Default/IndexedDB/http_*.indexeddb.leveldb
   ```
2. 가장 큰 폴더가 실제 데이터 위치. 해당 포트로 서버 띄우고 콘솔에서 확인.
3. 릴레이 서버로 JSON 추출 → public/ 에 임시 저장 → localhost:5173 콘솔에서 IndexedDB에 삽입.
4. **reports DB와 roster DB 모두** 이전해야 완전 복구.

### 섹션 분리 부서 구조

- `elementary`: `group = "kindergarten"` (유치부) / `"elementary"` (초등부)
- `middleHigh`: `group = "middle"` (중등부) / `"high"` (고등부). `null` → 중등부로 처리.
- `youngAdult`: `group = "college"` (대학부) / `"worker"` (직장부). `null` → 대학부로 처리.
- group 값 틀리면 카드가 잘못된 섹션에 분류되거나 한쪽에 몰림.

---

*마지막 업데이트: 2026-05-09*
