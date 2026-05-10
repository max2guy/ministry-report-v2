# Attendance Card Editor Design

## Summary

`ministry-report-v2`의 보고서 편집 UX를 숫자 입력 중심에서 `이름 카드 클릭형 출결` 방식으로 확장한다. 모든 부서는 같은 상호작용 모델을 사용하되, 새 보고서 초기 상태에서만 `유초등부`에 임시 명단 `권상우`, `천주아`를 자동 주입한다. 교회명은 더 이상 사용자가 입력하지 않고 `연천장로교회`로 고정한다.

기존 import 데이터는 즉시 카드형으로 강제 변환하지 않는다. 이미 저장된 v2/legacy 데이터는 기존 `attendance` 숫자를 그대로 유지하고, 새 보고서부터 카드형 출결을 본격 적용한다.

## Goals

- 교회명을 `연천장로교회`로 고정한다.
- 4개 부서 모두 이름 카드 기반으로 출석 상태를 토글할 수 있게 한다.
- 새 보고서 생성 시 유초등부에 임시 명단 `권상우`, `천주아`를 넣는다.
- 인원 추가도 카드 중심 흐름으로 처리한다.
- 기존 보고서 import 및 저장 목록/뷰어/요약 계약은 깨지지 않게 유지한다.

## Non-Goals

- 기존 import 데이터의 출석 숫자를 임시 이름 카드로 역변환하지 않는다.
- 장기결석, 심방, 보류 같은 다중 출결 상태를 이번 단계에 추가하지 않는다.
- Word/NAS 기능을 다시 도입하지 않는다.
- 교회명 다중 선택 또는 설정 화면을 추가하지 않는다.

## Current Constraints

- 현재 v2 데이터 모델은 부서별 `attendance`, `newVisitors`, `summary` 중심이다.
- 저장 목록/뷰어/백업/export/import는 `attendance` 숫자를 기준으로 작동한다.
- 기존 사용자는 이미 숫자만 있는 보고서 JSON을 가지고 있을 수 있다.
- 새 기능은 현재의 히스토리/요약/검색 계약과 함께 공존해야 한다.

## Chosen Approach

카드형 UI를 도입하되, 저장 모델에서는 기존 `attendance` 숫자를 계속 유지한다. 새 보고서에서는 `members` 배열이 출석 수의 실제 입력 원천이 되고, 카드 상태 변화가 `attendance`를 자동 계산한다. 기존 import 보고서는 `members`가 비어 있어도 허용하고, 기존 `attendance` 숫자를 그대로 보존한다.

이 접근은 다음 장점이 있다.

- 사용감은 v1의 카드형 출결에 가까워진다.
- 기존 뷰어, 히스토리, 요약 계산은 `attendance` 기반을 유지해서 영향 범위가 작다.
- legacy/import 데이터 변환 리스크를 최소화한다.

## Data Model Changes

### 1. Church Name

- `createEmptyReport()`는 모든 새 보고서에 `churchName: "연천장로교회"`를 넣는다.
- 편집 화면에서 교회명 텍스트 입력은 제거하거나 읽기 전용 표시로 대체한다.
- export/backup/viewer/history 검색에서는 그대로 `churchName` 필드를 사용한다.

### 2. Department Members

각 부서 데이터에 멤버 배열을 추가한다.

```ts
type DepartmentMemberStatus = "present" | "absent";

type DepartmentMember = {
  id: string;
  name: string;
  status: DepartmentMemberStatus;
};

type DepartmentReport = {
  key: DepartmentKey;
  name: string;
  attendance: number;
  newVisitors: number;
  summary: string;
  members?: DepartmentMember[];
};
```

규칙:

- 새 보고서에서는 모든 부서가 `members`를 가진다.
- 기존 import 보고서는 `members`가 없어도 유효하다.
- `attendance`는 카드형 보고서에서 `members.filter(status === "present").length`로 계산한다.
- `newVisitors`는 이번 단계에서 기존 숫자 입력을 유지한다.

## New Report Defaults

새 보고서 생성 시 기본값:

- `churchName = "연천장로교회"`
- `elementary.members = [{ name: "권상우" }, { name: "천주아" }]`
- `middleHigh.members = []`
- `youngAdult.members = []`
- `adult.members = []`

초기 상태의 모든 멤버 status는 `absent`로 시작한다. 따라서 새 보고서 첫 진입 시 출석 수는 0명이다.

## Existing Report Behavior

기존 import/v2 저장 보고서 중 `members`가 없는 항목은 그대로 지원한다.

- `attendance` 숫자는 유지한다.
- 뷰어/히스토리/요약은 기존처럼 숫자를 표시한다.
- 편집 화면에서는 `members`가 없는 보고서를 숫자 기반 레거시 상태로 취급한다.

이번 단계에서의 처리 원칙:

- 새 보고서: 카드형 fully 지원
- 기존 명단 없는 보고서: 기존 숫자 보존

필요하면 후속 단계에서 “기존 숫자 보고서를 카드형으로 전환” 도구를 별도 설계할 수 있다.

## Editor UX

### 1. Department Card Attendance

각 부서 편집 영역은 다음 요소를 가진다.

- 부서명
- 출석 카드 목록
- `인원 추가` 버튼
- 기존 `새가족`, `요약` 입력

카드 동작:

- 카드 1회 클릭: `absent -> present` 또는 `present -> absent`
- 카드에는 이름과 현재 상태가 시각적으로 표시된다.
- `attendance` 숫자 입력은 제거한다.

### 2. Add Member

부서별 `인원 추가` 버튼을 둔다.

1. 버튼 클릭
2. 새 이름 입력 UI 노출
3. 이름 입력 후 추가
4. 새 카드는 `absent` 상태로 목록에 붙음

이번 단계에서는 가장 단순한 inline 입력 또는 소형 폼으로 시작한다. 복잡한 모달은 필요 없다.

### 3. Legacy Numeric State

`members`가 없는 기존 보고서 편집 시:

- 출석 카드 목록 대신 기존 숫자 기반 출석 표시 또는 레거시 안내를 보여준다.
- 사용자가 새 보고서에서 기대하는 카드형 UX와, 기존 import 데이터의 숫자 보존 상태를 구분한다.

구현은 단순해야 한다. 예를 들면:

- `members`가 있으면 카드형 UI
- `members`가 없으면 기존 숫자 입력 UI

## Viewer and Summary Behavior

- `ReportCanvas`는 계속 `attendance` 숫자를 기준으로 총 출석과 부서 출석을 그린다.
- 저장 목록 요약/부서 요약도 기존 계산 함수를 유지한다.
- 카드형 보고서에서는 카드 토글이 `attendance`를 갱신하므로 기존 요약 시스템이 그대로 따라온다.

## Import / Export / Backup

### Import

- v2 import는 `members` 필드가 있으면 읽고, 없으면 생략한다.
- legacy import는 기존처럼 숫자 기반으로 마이그레이션한다.
- legacy import 시 자동 멤버 생성은 하지 않는다.

### Export / Backup

- v2 export/backup에는 `members`가 있으면 함께 저장한다.
- 기존 스키마 호환을 위해 `attendance` 숫자는 계속 함께 저장한다.

## Error Handling

- 빈 이름으로 멤버 추가 시 추가를 막고 안내한다.
- 같은 부서 내에서 이름 중복은 우선 허용하지 않는 쪽을 기본 추천한다.
- 단, 이번 단계에서는 “완전 동일 이름 중복 방지”를 간단한 trim 비교로 구현해도 충분하다.

## Testing Strategy

### Unit

- `createEmptyReport()`가 `churchName: "연천장로교회"`를 넣는지
- 유초등부 초기 멤버 2명이 생성되는지
- 카드 상태 기반으로 `attendance`가 계산되는지
- import 시 `members`가 없는 기존 보고서가 여전히 읽히는지

### Smoke

- 새 보고서에서 유초등부 카드 `권상우`, `천주아`가 보이는지
- 카드 클릭으로 출석 수가 오르내리는지
- 인원 추가 후 카드가 생기는지
- 저장 후 히스토리/뷰어/요약에 반영되는지
- 기존 import 숫자 보고서가 계속 열리는지

## Implementation Plan Shape

1. 데이터 모델 확장
2. 새 보고서 기본값 변경
3. import/export normalization 확장
4. 편집 UI 카드형 출결 구현
5. 레거시 숫자 UI fallback 유지
6. 테스트 보강

## Risks

- 기존 숫자 기반 편집과 새 카드형 편집을 한 화면에서 함께 다루기 때문에 조건 분기가 복잡해질 수 있다.
- `attendance`를 사용자 입력값이 아니라 파생값으로 바꾸는 구간에서 저장/중복 상태 버그가 날 수 있다.
- import/export에 `members` optional 필드를 넣을 때 기존 테스트가 예상보다 많이 흔들릴 수 있다.

## Risk Mitigations

- `members` 존재 여부를 기준으로 UI를 분기한다.
- 출석 수 계산을 헬퍼 함수 하나로 모은다.
- 기존 요약/뷰어 계약은 `attendance` 중심으로 유지한다.
- 새 보고서 카드형과 기존 import 숫자형을 스모크에서 둘 다 확인한다.

## Success Criteria

- 교회명은 새 보고서에서 항상 `연천장로교회`다.
- 새 보고서 유초등부에는 `권상우`, `천주아` 카드가 기본 표시된다.
- 카드 클릭만으로 출석 수가 계산된다.
- 인원 추가가 카드형 흐름으로 가능하다.
- 기존 저장/뷰어/요약/export/import 계약이 유지된다.
- 기존 명단 없는 import 데이터는 깨지지 않는다.
