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

## 5. 변경하지 않는 것

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
| `src/App.tsx` | 모바일 뷰 상태 분기 추가 |
| `src/styles.css` | 모바일 미디어쿼리 전면 개편 |

---

## 7. 버전 정보

이 변경은 앱 버전 **2.0**으로 식별한다.
`package.json` version을 `0.1.0` → `2.0.0`으로 업데이트한다.
