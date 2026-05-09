# 사역보고서 v2 — 모바일 UI 2.0 디자인 스펙

## 개요

기존 모바일 UI의 세련미 부족 문제를 해결하기 위한 전면 리디자인.
**모던 카드** 방향으로 — 그라데이션 헤더, 카드 그림자, 하단 탭바, 목록 우선 홈을 적용한다.
데스크톱 레이아웃은 변경하지 않는다 (`max-width: 820px` 미만에만 적용).
기존 테마 변수(`--clr-primary`, `--clr-bg` 등)는 그대로 유지한다.

---

## 1. 전체 구조 변경 (모바일 전용)

### 1-1. 하단 탭바 도입

기존 상단 세그먼트 컨트롤(`segmented-control`)을 모바일에서 **하단 탭바**로 대체한다.

**컴포넌트:** `src/features/nav/BottomTabBar.tsx` (신규)

```
[ 📋 보고서 ]  [ 👥 명단 ]  [ ⚙️ 계정 ]
```

- 탭바 높이: `56px` + iOS safe-area-inset 대응 (`padding-bottom: env(safe-area-inset-bottom)`)
- 활성 탭: 아이콘 + 텍스트 `--clr-primary` 색상, 비활성: `#aaa`
- 배경: `#fff`, 상단 구분선: `1px solid var(--clr-border)`, 그림자: `0 -2px 12px rgba(0,0,0,.06)`
- 아이콘: 이모지 대신 SVG 아이콘으로 구현 (📋→문서, 👥→사람, ⚙️→설정)

### 1-2. 상단 헤더 리디자인

**컴포넌트:** 기존 `.top-bar` CSS 수정

모바일에서 `top-bar`는 그라데이션 배경으로 변경:

```
배경: linear-gradient(135deg, var(--clr-primary), 어두운 변형)
날짜(소): 2026년 5월 10일 (일)  ← 작은 회색
앱 이름: 사역보고서               ← 흰색 굵은 폰트
아바타: 사용자 이니셜 원형 버튼   → (우측)
```

- 탭 버튼은 모바일에서 헤더에서 제거 (하단 탭바로 이동)
- 헤더는 `position: sticky; top: 0`으로 스크롤시 유지
- 본문 콘텐츠에 `padding-bottom: 70px` 추가 (하단 탭바 공간 확보)

---

## 2. 홈 화면 — 보고서 목록 우선

### 2-1. 앱 첫 화면 구조 변경

기존: 편집기(draft)가 메인, 하단에 히스토리 패널  
변경: **보고서 목록이 홈**, 탭하면 편집기로 진입

**모바일 전용 뷰 분기:** `App.tsx`에서 `window.innerWidth ≤ 820` 또는 CSS 미디어 기반으로
모바일에서 `activeTab === "report"` 상태를 두 단계로 분리:
- `report-list`: 보고서 목록 화면 (홈)
- `report-editor`: 편집기 화면 (목록에서 진입)

### 2-2. 보고서 목록 화면 (MobileReportList)

**컴포넌트:** `src/features/report/MobileReportList.tsx` (신규)

레이아웃:
```
[ 그라데이션 헤더 ]
[ + 새 보고서 작성 ] ← 그린 그라데이션 CTA 카드
[ 이전 보고서 ─────────── ]
[ 5월 3일 | 초등 39 · 중고등 31 · 청년 62  › ]
[ 4월 27일 | 초등 41 · 중고등 29 · 청년 60  › ]
[ ... ]
[ 하단 탭바 ]
```

- "새 보고서" 버튼: `background: linear-gradient(135deg, var(--clr-primary), ...)`, `border-radius: 12px`, 그림자
- 목록 카드: `background: #fff`, `border-radius: 12px`, `box-shadow: 0 2px 8px rgba(0,0,0,.07)`
- 날짜 + 부서별 출석 요약 한 줄 표시
- 탭하면 해당 보고서로 편집기 진입

### 2-3. 편집기 화면 (모바일)

헤더에 **뒤로가기 버튼** 추가 (← 보고서 목록):
```
‹ 보고서 목록
5월 10일 주일
```

기존 `ReportEditor` + `ReportHistoryPanel`은 모바일에서는 숨김.
대신 `MobileReportList`에서 히스토리 역할을 담당.

---

## 3. 로그인 화면 리디자인

**컴포넌트:** `src/features/auth/AuthGate.tsx` 수정

레이아웃:
```
[ 그라데이션 배너 (⛪ 사역보고서 / 부제) ]
   ↓ 아래로 겹쳐서 플로팅
[ 흰 카드 (border-radius: 16px, box-shadow) ]
  시작하기
  Google 계정으로 로그인하세요
  [ Google 로고 · Google로 계속하기 ]
  첫 번째 로그인 계정이 관리자가 됩니다
```

- 배너 높이: `200px`, 그라데이션: `linear-gradient(135deg, var(--clr-primary), 어두운 변형)`
- 카드: 배너 아래로 `-32px` 음수 마진으로 겹쳐 올라옴
- 카드 `padding: 24px`, `border-radius: 16px`, `box-shadow: 0 8px 32px rgba(0,0,0,.12)`
- Google 버튼: `border: 1.5px solid var(--clr-border)`, `border-radius: 12px`, 흰 배경

---

## 4. 카드 스타일 시스템

모바일에서 모든 패널 (`report-form`, `account-panel`, `history-panel` 등)에 적용:

| 속성 | 값 |
|---|---|
| `border-radius` | `12px` |
| `box-shadow` | `0 2px 8px rgba(0,0,0,.07)` |
| `border` | 제거 (그림자로 구분) |
| `padding` | `14px 16px` |
| `background` | `var(--clr-card-bg)` 유지 |

---

## 5. 변경하지 않는 것 (섹션 9로 이동됨 — 아래 참고)

- 데스크톱 레이아웃 (`max-width: 820px` 초과) — 완전히 동일
- 출석 카드 그리드 스타일 (사용자가 C 제외 선택)
- 색상 테마 시스템 (green/blue/orange 변수)
- Firestore / Firebase 로직
- 보고서 데이터 구조

---

## 6. 구현 범위 요약

| 파일 | 변경 유형 |
|---|---|
| `src/features/nav/BottomTabBar.tsx` | 신규 생성 |
| `src/features/report/MobileReportList.tsx` | 신규 생성 |
| `src/features/auth/AuthGate.tsx` | 로그인 화면 레이아웃 수정 |
| `src/features/mode/AppModeToggle.tsx` | 신규 생성 (보고자/뷰어 토글) |
| `src/features/mode/useAppMode.ts` | 신규 생성 (localStorage 훅) |
| `src/App.tsx` | 모바일 뷰 상태 분기 + 모드 분기 추가 |
| `src/styles.css` | 모바일 미디어쿼리 전면 개편 |

---

## 8. 앱 모드 — 보고자 / 뷰어

### 8-1. 개요

같은 Google 계정이라도 **보고자 모드**와 **뷰어 모드** 중 선택해서 사용할 수 있다.

- **보고자 모드**: 현재와 동일. 보고서 작성·편집·저장 전체 기능.
- **뷰어 모드**: 최종 보고서만 읽기 전용으로 표시. 편집 버튼 없음, 깔끔한 프레젠테이션 레이아웃.

담임 목사님 등 보고 받는 분은 뷰어 모드로 사용. 현재는 테스트 단계이므로 **누구나 언제든지** 모드 전환 가능. 추후 어드민이 계정별로 잠금 예정 (이번 구현에서는 잠금 기능 없음).

### 8-2. 모드 저장

- `localStorage` key: `"ministry-app-mode"`, 값: `"reporter" | "viewer"`
- 로그인 상태와 무관하게 기기에 유지 (다음 로그인에도 마지막 모드로 진입)
- 기본값: `"reporter"` (값 없을 때)

### 8-3. 모드 전환 UI

위치: 헤더 우측 아바타 버튼 옆, 또는 계정 탭 내 상단

```
[ 보고자 모드 | 뷰어 모드 ]  ← 세그먼트 토글
```

- 전환 즉시 반영 (페이지 새로고침 없이)
- 전환 시 localStorage 업데이트

### 8-4. 뷰어 모드 레이아웃

홈 화면: 보고서 목록 (읽기 전용) — 탭하면 `ReportViewer` 진입

뷰어 화면:
```
[ 헤더: 날짜 + "뷰어 모드" 배지 ]
[ 부서별 출석 요약 카드 (큰 숫자) ]
[ 특이사항 / 메모 섹션 ]
[ ← 목록으로 ]
```

- 저장/편집 버튼 없음
- 기존 `ReportViewer` 컴포넌트를 모바일에서 활용
- 하단 탭바는 그대로 표시 (명단, 계정 탭도 읽기 전용으로 동작)

### 8-5. 추후 잠금 확장 포인트

Firestore `users/{uid}` 문서에 `modeRestriction: "viewer" | null` 필드 추가 예정.
이번 구현에서는 해당 필드를 읽지 않음 (항상 전환 허용).

---

## 9. 변경하지 않는 것

이 변경은 앱 버전 **2.0**으로 식별한다.
`package.json` version을 `0.1.0` → `2.0.0`으로 업데이트한다.
