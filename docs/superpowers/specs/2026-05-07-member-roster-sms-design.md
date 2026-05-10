# 명단관리 + 문자보내기 설계

## 개요

두 기능을 추가한다:
1. **명단관리 탭** — 부서별 멤버 이름/구역장 전화번호를 영구 저장·편집하는 별도 탭
2. **문자보내기** — 장년 부서 결석자를 구역장·교구장에게 순차 SMS 발송 (모바일 전용)

---

## 1. 데이터 모델

### 1-1. `DepartmentMember` 변경 (기존 타입에 추가)
```ts
type DepartmentMember = {
  id: string;
  name: string;
  status: DepartmentMemberStatus;
  role?: DepartmentMemberRole;
  phone?: string;   // 구역장(leader)만 실제로 입력됨
};
```

### 1-2. 새 타입: `MemberRoster`
```ts
type MemberRoster = {
  departments: Record<DepartmentKey, RosterDepartment>;
  updatedAt: string;
};

type RosterDepartment =
  | { kind: 'flat'; members: RosterMember[] }     // 유초등부·중고등부·청년부
  | { kind: 'zoned'; zones: RosterZone[] };        // 장년

type RosterMember = {
  id: string;
  name: string;
  role?: DepartmentMemberRole;
  phone?: string;
};

type RosterZone = {
  id: string;
  name: string;
  district: number;        // 1 = 1교구(1~6구역), 2 = 2교구(7~12구역)
  members: RosterMember[];
};
```

### 1-3. 교구장 정의
- **1교구장** = 1구역 구역장 (district=1, zones[0] leader)
- **2교구장** = 7구역 구역장 (district=2, zones[6] leader)
- 별도 필드 없음, zone leader phone으로 결정

### 1-4. 스토리지
- IndexedDB에 `memberRoster` 오브젝트 스토어 추가
- 키: 계정 email (계정당 1개 레코드)
- 레코드 없으면 `reportTypes.ts`의 하드코딩 기본값 사용
- `src/storage/memberRosterStore.ts` 신규 생성

---

## 2. 명단관리 탭

### 2-1. 탭 위치
상단 모드 탭 `보고서 | 뷰어` 옆에 `명단관리` 추가.

### 2-2. 화면 구조
```
[보고서] [뷰어] [명단관리]

명단관리 내부:
┌──────────────────────────────────┐
│ [유초등부] [중고등부] [청년부] [장년] │  ← 부서 탭
├──────────────────────────────────┤
│  (부서별 멤버 이름 편집)            │
│  이름 목록 + 추가/삭제             │
└──────────────────────────────────┘

[전화번호 관리]                        ← 하단 별도 섹션
┌──────────────────────────────────┐
│  1구역장   [번호입력/수정]           │
│  2구역장   [번호입력/수정]           │
│  ...                              │
│  12구역장  [번호입력/수정]           │
└──────────────────────────────────┘
```

### 2-3. 부서별 편집 규칙
- **유초등부·중고등부·청년부**: 이름 목록 (추가/삭제). 역할(장/권) 없음.
- **장년**: 교구→구역→멤버 계층. 이름·역할(장/권/일반) 편집. 전화번호 없음.

### 2-4. 전화번호 관리 섹션
- 구역장 12명 번호만 관리
- 전화번호 값 자체는 화면에 노출하지 않음
- `[번호입력]` / `[번호수정]` 클릭 시 입력창 토글, 확인 후 닫힘
- 저장 시점: 변경 즉시 자동 저장 (IndexedDB)

### 2-5. 새 보고서에 반영
- `createEmptyReport(roster?)` — 로스터가 있으면 로스터 기반, 없으면 하드코딩 기본값
- App 레벨에서 로스터를 로드 후 전달 (createEmptyReport를 async로 변경하지 않음, roster를 인자로)
- **기존 저장된 보고서는 영향 없음** — 로스터 변경은 다음 새 보고서부터 적용
- **보고서 복사(cloneReportAsDraft)** — 원본 보고서의 멤버 그대로 복사, 로스터 미참조

---

## 3. 문자보내기

### 3-1. 위치
보고서 편집 화면의 **장년 구역 에디터(ZonedDepartmentAttendanceEditor)** 하단에 `[📱 문자 발송]` 버튼 추가.

### 3-2. 모바일 판별
```ts
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
```

### 3-3. 데스크탑 동작
버튼 클릭 시 토스트 경고:
> "이 기능은 모바일에서만 사용할 수 있습니다."

버튼은 항상 표시되며, 클릭 후 경고로 인지시킴 (비활성화 아님).

### 3-4. 모바일 동작: SMS 발송 패널
버튼 클릭 → 모달/슬라이드업 패널 열림.

**패널 구성:**
```
[📤 전체 순차 전송]  [⏹]   2/14 진행중

⚠️ 번호 미등록: 5구역, 9구역

── 구역장 개별 전송 ──
1구역  결석자 2명  [📨 문자앱 열기] [✅ 수동완료]
3구역  결석자 1명  ✓ 전송완료
...

── 교구장 전체 결석자 전송 ──
1교구  결석 3명  [📨 문자앱 열기]
2교구  결석 4명  [📨 문자앱 열기]
```

### 3-5. 순차 큐 흐름
1. `[📤 전체 순차 전송]` 클릭 → 미전송 항목 큐 생성
2. 첫 번째 항목: `sms:번호?body=메시지` 로 문자앱 열기
3. 사용자 문자 전송 후 앱으로 복귀
4. `[✅ 전송완료]` 또는 `[↩️ 미전송]` 클릭
5. 다음 항목 자동 진행

### 3-6. 메시지 형식
구역장:
```
[2026-05-07 주일 결석 현황]
1구역 결석자 2명
홍길동 김철수
```

교구장:
```
[2026-05-07 주일 결석 현황]
1교구 총 결석 3명

1구역: 홍길동 김철수
3구역: 박영희
```

### 3-7. 발송 상태 메모리
- 세션 내 메모리만 유지 (새로고침 시 초기화) — 기존 앱과 동일
- 결석자 없으면 항목 목록에서 생략

---

## 4. 파일 구조 (신규/수정)

```
src/
  domain/
    memberRoster.ts          [신규] 타입 정의, 기본값 생성 함수
  storage/
    memberRosterStore.ts     [신규] IndexedDB CRUD
  features/
    roster/
      MemberRosterTab.tsx    [신규] 명단관리 탭 최상위
      RosterDepartmentEditor.tsx  [신규] 부서별 편집
      RosterZoneEditor.tsx   [신규] 장년 구역 편집
      PhoneNumberManager.tsx [신규] 전화번호 관리 섹션
    report/
      SmsPanel.tsx           [신규] 문자 발송 패널
      ZonedDepartmentAttendanceEditor.tsx  [수정] 문자 발송 버튼 추가
  App.tsx                    [수정] 탭 추가, 로스터 로드
  domain/reportTypes.ts      [수정] phone 필드, createEmptyReport 시그니처
```

---

## 5. 제약사항

- SMS는 장년(zone 기반) 부서에만 적용
- 전화번호는 화면에 직접 노출하지 않음
- 발송 상태는 세션 메모리만 (새로고침 시 초기화)
- 데스크탑에서 SMS 기능 시도 시 경고 토스트, 기능 차단
