# 모바일 편집기 v2 + 버그 수정 — 디자인 스펙

## 개요

모바일 편집기 화면에서 데스크톱 사이드바 요소가 그대로 노출되는 문제를 해결하고,
함께 발견된 데이터 버그 2건을 수정한다.

**네임카드 그리드 스타일은 변경하지 않는다.**  
데스크톱 레이아웃은 변경하지 않는다 (`max-width: 820px` 초과).

---

## 1. 모바일 편집기 화면 개선

### 1-1. 현재 문제

모바일에서 보고서 탭 → 편집기 진입 시, `ReportEditor`의 사이드바 패널이 그대로 세로로 쌓임:
- 보고자 계정 패널 (이름, 이메일, 로그아웃)
- 새 보고서 / 저장 / 내보내기 버튼 블록
- JSON 가져오기 패널
- GitHub 백업 설정 패널 (관리자)
- 그 아래에 섹션 탭바 + 실제 편집 폼

결과: 실제 편집 폼에 도달하려면 스크롤 필요, 저장 버튼 접근성 나쁨.

### 1-2. 변경 방향

**모바일 편집기에서 사이드바 패널 전부 제거.**  
편집기 화면에는 섹션 탭바 + 편집 폼 + 하단 저장바만 표시.

```
[ 그라데이션 헤더: ‹ 보고서 목록 | 날짜 ]
[ 섹션 탭바: 기본정보 · 유초등부 · 중고등부 · 청년부 · 교구 · 기도·광고 ]  ← 가로 스크롤
[ 편집 폼 (TabbedReportForm) — 네임카드 그대로 ]
[ 저장하기 버튼 ] ← 하단 고정바
[ 하단 탭바 ]
```

### 1-3. 섹션 탭바 개선

**현재 문제:** 탭이 왼쪽으로 잘리거나 활성 탭이 화면 밖에 있어도 자동 스크롤 안 됨.

**수정:**
- `.report-tab-bar` 모바일에서 `overflow-x: auto; scroll-behavior: smooth`
- 탭 클릭 시 `scrollIntoView({ inline: "center", behavior: "smooth" })`로 활성 탭 자동 중앙 이동

### 1-4. 하단 저장바

`ReportEditor` 기존 저장 버튼 대신, 모바일에서 하단 고정 저장바 표시:

```
position: fixed
bottom: calc(56px + env(safe-area-inset-bottom))  /* 하단 탭바 위 */
left: 0; right: 0
padding: 8px 16px
background: var(--clr-bg)
border-top: 1px solid var(--clr-border)
```

버튼: `background: linear-gradient(135deg, var(--clr-primary), 어두운 변형)`, `border-radius: 10px`, `width: 100%`

저장 불가 상태(`canSave === false`)일 때: 버튼 `opacity: 0.5`, `disabled`

### 1-5. 내보내기 · JSON 가져오기 이동

모바일에서 편집기 화면에서 제거, 계정 탭으로 이동:

계정 탭(`mobileTab === "account"`) 내 `mobile-account-screen` 섹션에 추가:

```
[ 보고자 계정 카드 ]
[ 앱 모드 토글 ]
[ 데이터 카드 ]
  [ 내보내기 ] [ JSON 가져오기 ]  ← 나란히
[ 테마 선택 ]
[ GitHub 설정 (관리자) ]
```

---

## 2. 버그 수정

### 2-1. 섹션 배분 초기화 버그

**파일:** `src/domain/memberRoster.ts`

**원인:** `mergeRosterFromReport`의 `mergeFlatDept` 함수에서 `m.group`이 falsy일 때 `group` 필드를 생략:

```ts
// 현재 (버그)
...(m.group && { group: m.group })

// 수정: 기존 roster member의 group을 폴백으로 사용
const group = m.group ?? prev?.group;
return {
  id: m.id,
  name: m.name,
  ...(prev?.phone && { phone: prev.phone }),
  ...(group !== undefined && { group }),
  ...(m.role && { role: m.role }),
};
```

이전 백업이나 group 필드 없는 데이터 import 시에도 기존 섹션 배분 유지.

### 2-2. 새 보고서 기본 출석 = 0명 버그

**파일:** `src/domain/reportTypes.ts`

**원인:** `createEmptyReport`에서 교구 zone 멤버 전원이 `"present"`로 초기화되어, 결석 처리 없이 저장하면 전원 출석 인원이 그대로 출석 수가 됨.

**수정:** `createEmptyReport`에서 zone 멤버 기본 status를 `"absent"`로 변경:

```ts
// 현재
status: "present"

// 수정
status: "absent"
```

새 보고서는 출석 0명에서 시작, 실제 참석자를 네임카드로 탭하여 출석 체크.

> **기존 저장된 보고서는 영향 없음.** `createEmptyReport`는 새 보고서 생성 시에만 호출.

---

## 3. 변경하지 않는 것

- 네임카드 그리드 스타일 및 동작
- 데스크톱 레이아웃 (`max-width: 820px` 초과)
- 색상 테마 시스템
- Firestore / Firebase 로직
- 드래그 앤 드롭 기능

---

## 4. 구현 범위 요약

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `src/App.tsx` | 수정 | 모바일 편집기에서 사이드바 패널 제거, 내보내기·가져오기를 계정 탭으로 이동, 하단 저장바 추가 |
| `src/styles.css` | 수정 | 모바일 섹션 탭바 가로 스크롤, 저장바 CSS, 계정 탭 데이터 섹션 CSS |
| `src/features/report/TabbedReportForm.tsx` | 수정 | 탭 클릭 시 `scrollIntoView` 호출 |
| `src/domain/memberRoster.ts` | 수정 | `group` 필드 보존 버그 수정 |
| `src/domain/reportTypes.ts` | 수정 | `createEmptyReport` 기본 status `"absent"` |
