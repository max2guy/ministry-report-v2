# 명단관리 + 문자보내기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부서별 멤버 명단을 영구 저장·편집하는 명단관리 탭과, 장년 부서 결석자를 구역장·교구장에게 순차 SMS 발송하는 모바일 전용 기능을 추가한다.

**Architecture:** 독립 IndexedDB(`ministry-report-v2-roster`)에 계정별 MemberRoster를 저장하고, 새 보고서 생성 시 roster를 참조한다. SMS는 브라우저 `sms:` URL scheme 기반 순차 큐이며 발송 상태는 세션 메모리에만 유지한다.

**Tech Stack:** React 19, TypeScript, idb (IndexedDB), Vite, Vitest, Playwright

---

## 파일 구조

| 경로 | 상태 | 역할 |
|------|------|------|
| `src/domain/memberRoster.ts` | 신규 | MemberRoster 타입 + 기본값 팩토리 |
| `src/domain/memberRoster.test.ts` | 신규 | 단위 테스트 |
| `src/storage/memberRosterStore.ts` | 신규 | IndexedDB CRUD (별도 DB) |
| `src/domain/reportTypes.ts` | 수정 | DepartmentMember에 phone 추가, createEmptyReport 시그니처 변경 |
| `src/domain/reportTypes.test.ts` | 수정 | 업데이트된 시그니처 반영 |
| `src/features/roster/MemberRosterTab.tsx` | 신규 | 명단관리 탭 최상위 |
| `src/features/roster/RosterFlatEditor.tsx` | 신규 | 평탄 부서(유초등·중고등·청년) 편집 |
| `src/features/roster/RosterZoneEditor.tsx` | 신규 | 장년 구역별 멤버 편집 |
| `src/features/roster/PhoneNumberManager.tsx` | 신규 | 구역장 12명 전화번호 관리 |
| `src/features/report/smsUtils.ts` | 신규 | 모바일 판별 + 메시지 빌더 |
| `src/features/report/smsUtils.test.ts` | 신규 | 단위 테스트 |
| `src/features/report/SmsPanel.tsx` | 신규 | SMS 순차 큐 UI |
| `src/features/report/ZonedDepartmentAttendanceEditor.tsx` | 수정 | 문자 발송 버튼 + SmsPanel 연동 |
| `src/App.tsx` | 수정 | roster 로드, 명단관리 탭 추가 |
| `src/styles.css` | 수정 | 신규 컴포넌트 스타일 |

---

## Task 1: MemberRoster 도메인 타입

**Files:**
- Create: `src/domain/memberRoster.ts`
- Create: `src/domain/memberRoster.test.ts`

- [ ] **Step 1: 타입 파일 작성**

```typescript
// src/domain/memberRoster.ts
import type { DepartmentKey, DepartmentMemberRole } from "./reportTypes";

export type RosterMember = {
  id: string;
  name: string;
  role?: DepartmentMemberRole;
  phone?: string;
};

export type RosterZone = {
  id: string;
  name: string;
  district: number;
  members: RosterMember[];
};

export type RosterDepartment =
  | { kind: "flat"; members: RosterMember[] }
  | { kind: "zoned"; zones: RosterZone[] };

export type MemberRoster = {
  departments: Record<DepartmentKey, RosterDepartment>;
  updatedAt: string;
};

export function createDefaultRoster(): MemberRoster {
  return {
    departments: {
      elementary: {
        kind: "flat",
        members: [
          { id: crypto.randomUUID(), name: "권상우" },
          { id: crypto.randomUUID(), name: "천주아" },
        ],
      },
      middleHigh: {
        kind: "flat",
        members: [
          "김규인","김주영","김주혁","이예진","이태양",
          "이호석","정서원","정시원","정소원",
          "김주찬","변아영","변현섭","최우진",
        ].map(name => ({ id: crypto.randomUUID(), name })),
      },
      youngAdult: {
        kind: "flat",
        members: [
          "고현아","김보은","김정인","김주은","김태양",
          "라규미","박시은","신승환","안수용","유다희",
          "유세희","이석준","정은정","정혜정","차예담",
          "한상희","한혜원","황원영",
        ].map(name => ({ id: crypto.randomUUID(), name })),
      },
      adult: {
        kind: "zoned",
        zones: createDefaultAdultZones(),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

function mkMember(name: string, role: DepartmentMemberRole): RosterMember {
  return { id: crypto.randomUUID(), name, role };
}
function mkZoneMember(name: string): RosterMember {
  return { id: crypto.randomUUID(), name, role: "member" };
}

function makeZone(name: string, district: number, members: RosterMember[]): RosterZone {
  return { id: crypto.randomUUID(), name, district, members };
}

function createDefaultAdultZones(): RosterZone[] {
  return [
    makeZone("1구역", 1, [
      mkMember("이명숙", "leader"), mkMember("김영순", "inspector"),
      ...["안성문","김명호","이종순","지정웅","임한나","정나단","조병옥","조병임","이덕재","최순복","양창운","최정분","황재희","전정예"].map(mkZoneMember),
    ]),
    makeZone("2구역", 1, [
      mkMember("민옥화", "leader"), mkMember("박진숙", "inspector"),
      ...["김두곤","송을범","심순덕","염재훈","이승숙","이윤형","당윤수","이지현","정현철","임금란","임희순","김석규","조남주"].map(mkZoneMember),
    ]),
    makeZone("3구역", 1, [
      mkMember("임미자", "leader"), mkMember("김성숙", "inspector"),
      ...["우정식","박영준","권옥자","류홍렬","박순옥","서유정","황흥도","이이순","김수근","최순옥","최현숙"].map(mkZoneMember),
    ]),
    makeZone("4구역", 1, [
      mkMember("임혜진", "leader"), mkMember("조성주", "inspector"),
      ...["임법상","김수년","김명옥","김애경","손정숙","김경석","유제경","엄동규","이도화","최인숙","이진우","황영숙","김주훈"].map(mkZoneMember),
    ]),
    makeZone("5구역", 1, [
      mkMember("오민자", "leader"), mkMember("이미자", "inspector"),
      ...["이상석","한준식","고분선","김교순","김혜진","노필언","박승애","박화자","유분의","이성희","이승현","이희열","임정숙","장국지","최종분"].map(mkZoneMember),
    ]),
    makeZone("6구역", 1, [
      mkMember("김순이", "leader"), mkMember("김미경", "inspector"),
      ...["김덕희","김은주","신영락","노학심","박순영","변기성","윤숙경","이순희","박종학","이춘생","최봉석","최태인"].map(mkZoneMember),
    ]),
    makeZone("7구역", 2, [
      mkMember("이정순", "leader"), mkMember("현명숙", "inspector"),
      ...["이규훈","권성배","김연자","김희수","송경섭","송현숙","김동호","유순하","박광천","이재선","조자형","양태모","한선분"].map(mkZoneMember),
    ]),
    makeZone("8구역", 2, [
      mkMember("김영숙", "leader"), mkMember("유미선", "inspector"),
      ...["나인용","권금애","김미순","김병기","김은정","김규보","심기동","원흥순","이현상","윤석현","최필남","정현숙","심완섭","최기환"].map(mkZoneMember),
    ]),
    makeZone("9구역", 2, [
      mkMember("양경순", "leader"), mkMember("전미영", "inspector"),
      ...["이봉열","강상희","고환필","김미용","모동수","박순복","박영철","윤여임","이영주","김효철","한정애"].map(mkZoneMember),
    ]),
    makeZone("10구역", 2, [
      mkMember("조옥희", "leader"), mkMember("성복임", "inspector"),
      ...["박양권","박덕순","윤정희","신임재","김건중","이명희","정대호","지정옥","고경설","이옥현","지행자","곽명희"].map(mkZoneMember),
    ]),
    makeZone("11구역", 2, [
      mkMember("최숙녀", "leader"), mkMember("최옥연", "inspector"),
      ...["한명식","박종금","송종란","전준석","이옥순","김명량","이한나","김광진","장월기","정국자","최기복","한승훈"].map(mkZoneMember),
    ]),
    makeZone("12구역", 2, [
      mkMember("유은희", "leader"), mkMember("조명숙", "inspector"),
      ...["안준용","이순용","강지아","나요나","전진구","박진아","정민시","이사라","천성현","최주희","정수미","민건우","한상미","윤승희"].map(mkZoneMember),
    ]),
  ];
}
```

- [ ] **Step 2: 단위 테스트 작성**

```typescript
// src/domain/memberRoster.test.ts
import { describe, expect, it, vi } from "vitest";
import { createDefaultRoster } from "./memberRoster";

describe("createDefaultRoster", () => {
  it("creates a roster with all four departments", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    expect(roster.departments.elementary.kind).toBe("flat");
    expect(roster.departments.middleHigh.kind).toBe("flat");
    expect(roster.departments.youngAdult.kind).toBe("flat");
    expect(roster.departments.adult.kind).toBe("zoned");
  });

  it("elementary has 2 members", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.elementary;
    if (dept.kind !== "flat") throw new Error("expected flat");
    expect(dept.members.map(m => m.name)).toEqual(["권상우", "천주아"]);
  });

  it("adult has 12 zones across 2 districts", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.adult;
    if (dept.kind !== "zoned") throw new Error("expected zoned");
    expect(dept.zones).toHaveLength(12);
    expect(dept.zones.filter(z => z.district === 1)).toHaveLength(6);
    expect(dept.zones.filter(z => z.district === 2)).toHaveLength(6);
  });

  it("zone leaders and inspectors have correct roles", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-id" });
    const roster = createDefaultRoster();
    const dept = roster.departments.adult;
    if (dept.kind !== "zoned") throw new Error("expected zoned");
    const zone1 = dept.zones[0];
    expect(zone1.members.find(m => m.role === "leader")?.name).toBe("이명숙");
    expect(zone1.members.find(m => m.role === "inspector")?.name).toBe("김영순");
  });
});
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

```bash
cd "/Users/kimwoojung/Documents/New project/Projects/ministry-report-v2"
npm test -- --reporter=verbose src/domain/memberRoster.test.ts
```

Expected: FAIL (파일 없음)

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --reporter=verbose src/domain/memberRoster.test.ts
```

Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/domain/memberRoster.ts src/domain/memberRoster.test.ts
git commit -m "feat: add MemberRoster domain types and default factory"
```

---

## Task 2: MemberRosterStore (IndexedDB)

**Files:**
- Create: `src/storage/memberRosterStore.ts`

- [ ] **Step 1: 스토어 작성**

별도 DB(`ministry-report-v2-roster`) 사용 — 기존 reports DB 버전과 충돌 방지.

```typescript
// src/storage/memberRosterStore.ts
import { openDB } from "idb";
import { createDefaultRoster, type MemberRoster } from "../domain/memberRoster";

const DB_NAME = "ministry-report-v2-roster";
const STORE_NAME = "rosters";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "email" });
    },
  });
}

type RosterRecord = MemberRoster & { email: string };

export async function loadRoster(email: string): Promise<MemberRoster> {
  const database = await db();
  const record: RosterRecord | undefined = await database.get(STORE_NAME, email);
  return record ?? createDefaultRoster();
}

export async function saveRoster(email: string, roster: MemberRoster): Promise<void> {
  const database = await db();
  await database.put(STORE_NAME, { ...roster, email });
}
```

- [ ] **Step 2: API 노출 테스트**

```typescript
// src/storage/memberRosterStore.test.ts
import { describe, expect, it } from "vitest";
import { loadRoster, saveRoster } from "./memberRosterStore";

describe("memberRosterStore", () => {
  it("exposes the roster storage API", () => {
    expect(typeof loadRoster).toBe("function");
    expect(typeof saveRoster).toBe("function");
  });
});
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npm test -- --reporter=verbose src/storage/memberRosterStore.test.ts
```

Expected: 1 passed

- [ ] **Step 4: 커밋**

```bash
git add src/storage/memberRosterStore.ts src/storage/memberRosterStore.test.ts
git commit -m "feat: add MemberRosterStore with separate IndexedDB"
```

---

## Task 3: reportTypes 수정 — phone 필드 + roster 연동

**Files:**
- Modify: `src/domain/reportTypes.ts`
- Modify: `src/domain/reportTypes.test.ts`

- [ ] **Step 1: DepartmentMember에 phone 추가**

`src/domain/reportTypes.ts`의 `DepartmentMember` 타입에 한 줄 추가:

```typescript
export type DepartmentMember = {
  id: string;
  name: string;
  status: DepartmentMemberStatus;
  role?: DepartmentMemberRole;
  phone?: string;   // 추가
};
```

- [ ] **Step 2: createEmptyReport 시그니처 변경**

`createEmptyReport` 함수 시그니처에 optional roster 파라미터 추가. roster가 있으면 roster 멤버를 사용, 없으면 기존 하드코딩 유지.

```typescript
import type { MemberRoster } from "./memberRoster";

export function createEmptyReport(now = new Date(), roster?: MemberRoster): MinistryReport {
  const iso = now.toISOString();

  // roster 있으면 roster 기반, 없으면 기존 하드코딩
  const elementaryMembers = (() => {
    if (roster?.departments.elementary.kind === "flat") {
      return roster.departments.elementary.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers(["권상우", "천주아"]);
  })();

  const middleHighMembers = (() => {
    if (roster?.departments.middleHigh.kind === "flat") {
      return roster.departments.middleHigh.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers([
      "김규인","김주영","김주혁","이예진","이태양",
      "이호석","정서원","정시원","정소원",
      "김주찬","변아영","변현섭","최우진",
    ]);
  })();

  const youngAdultMembers = (() => {
    if (roster?.departments.youngAdult.kind === "flat") {
      return roster.departments.youngAdult.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers([
      "고현아","김보은","김정인","김주은","김태양",
      "라규미","박시은","신승환","안수용","유다희",
      "유세희","이석준","정은정","정혜정","차예담",
      "한상희","한혜원","황원영",
    ]);
  })();

  const adultZones = (() => {
    if (roster?.departments.adult.kind === "zoned") {
      return roster.departments.adult.zones.map(z => ({
        id: z.id,
        name: z.name,
        district: z.district,
        members: z.members.map(m => ({
          id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
        })),
      }));
    }
    return createAdultZones();
  })();

  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    title: "주간 사역보고서",
    reportDate: iso.slice(0, 10),
    churchName: "연천장로교회",
    pastorName: "",
    departments: {
      elementary: {
        key: "elementary", name: "유초등부",
        attendance: elementaryMembers.length,
        newVisitors: 0, summary: "",
        members: elementaryMembers,
      },
      middleHigh: {
        key: "middleHigh", name: "중고등부",
        attendance: middleHighMembers.length,
        newVisitors: 0, summary: "",
        members: middleHighMembers,
      },
      youngAdult: {
        key: "youngAdult", name: "청년부",
        attendance: youngAdultMembers.length,
        newVisitors: 0, summary: "",
        members: youngAdultMembers,
      },
      adult: {
        key: "adult", name: "장년",
        attendance: deriveAdultAttendance(adultZones),
        newVisitors: 0, summary: "",
        zones: adultZones,
      },
    },
    offerings: { total: 0, memo: "" },
    prayerRequests: [],
    announcements: [],
    createdAt: iso,
    updatedAt: iso,
  };
}
```

- [ ] **Step 3: 기존 하드코딩 함수 정리**

`createEmptyReport`에서 더 이상 필요 없는 인라인 배열 선언들을 제거. `createAdultZones`와 `createDepartmentMembers`는 폴백으로 유지.

- [ ] **Step 4: 단위 테스트 통과 확인**

```bash
npm test -- --reporter=verbose src/domain/reportTypes.test.ts
```

Expected: 3 passed (기존 테스트 변경 불필요 — roster 없으면 기존 동작 유지)

- [ ] **Step 5: 커밋**

```bash
git add src/domain/reportTypes.ts
git commit -m "feat: add phone field to DepartmentMember, roster-aware createEmptyReport"
```

---

## Task 4: PhoneNumberManager 컴포넌트

**Files:**
- Create: `src/features/roster/PhoneNumberManager.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/features/roster/PhoneNumberManager.tsx
import { useState } from "react";
import type { MemberRoster, RosterZone } from "../../domain/memberRoster";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

function getZones(roster: MemberRoster): RosterZone[] {
  const adult = roster.departments.adult;
  return adult.kind === "zoned" ? adult.zones : [];
}

export function PhoneNumberManager({ roster, onChange }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const zones = getZones(roster);
  const leaders = zones.map(z => z.members.find(m => m.role === "leader"));

  function handleOpen(i: number) {
    setOpenIdx(i);
    setDraft(leaders[i]?.phone ?? "");
  }

  function handleSave(i: number) {
    const formatted = draft.trim().replace(/[^0-9-]/g, "");
    const adult = roster.departments.adult;
    if (adult.kind !== "zoned") return;
    const nextZones = adult.zones.map((z, zi) =>
      zi !== i ? z : {
        ...z,
        members: z.members.map(m =>
          m.role === "leader" ? { ...m, phone: formatted || undefined } : m
        ),
      }
    );
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        adult: { kind: "zoned", zones: nextZones },
      },
      updatedAt: new Date().toISOString(),
    });
    setOpenIdx(null);
    setDraft("");
  }

  return (
    <section className="phone-manager">
      <h3>전화번호 관리</h3>
      <p className="phone-manager-desc">구역장 전화번호 (문자 발송에 사용)</p>
      <ul className="phone-manager-list">
        {zones.map((zone, i) => (
          <li key={zone.id} className="phone-manager-item">
            <span className="phone-manager-zone">{zone.name}장</span>
            <span className="phone-manager-name">{leaders[i]?.name ?? "-"}</span>
            {openIdx === i ? (
              <span className="phone-manager-input-row">
                <input
                  type="tel"
                  aria-label={`${zone.name}장 전화번호`}
                  value={draft}
                  placeholder="010-0000-0000"
                  onChange={e => setDraft(e.currentTarget.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); handleSave(i); }
                    if (e.key === "Escape") { setOpenIdx(null); setDraft(""); }
                  }}
                  autoFocus
                />
                <button type="button" onClick={() => handleSave(i)}>저장</button>
                <button type="button" className="btn-cancel" onClick={() => { setOpenIdx(null); setDraft(""); }}>취소</button>
              </span>
            ) : (
              <button
                type="button"
                className="phone-manager-edit-btn"
                onClick={() => handleOpen(i)}
              >
                {leaders[i]?.phone ? "수정" : "입력"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.phone-manager {
  margin-top: 24px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #d9ded6;
  border-radius: 8px;
}

.phone-manager h3 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #24564a;
}

.phone-manager-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: #5e6b65;
}

.phone-manager-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.phone-manager-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f3f0;
}

.phone-manager-zone {
  font-size: 13px;
  font-weight: 600;
  color: #374740;
  min-width: 60px;
}

.phone-manager-name {
  font-size: 13px;
  color: #5e6b65;
  flex: 1;
}

.phone-manager-edit-btn {
  background: transparent;
  border: 1px solid #9ecfc2;
  color: #24564a;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.phone-manager-input-row {
  display: flex;
  gap: 4px;
  flex: 1;
}

.phone-manager-input-row input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #9ecfc2;
  border-radius: 4px;
  font-size: 13px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #d9ded6;
  color: #5e6b65;
  font-size: 12px;
  padding: 3px 10px;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/roster/PhoneNumberManager.tsx src/styles.css
git commit -m "feat: add PhoneNumberManager component"
```

---

## Task 5: RosterFlatEditor (유초등부·중고등부·청년부)

**Files:**
- Create: `src/features/roster/RosterFlatEditor.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/features/roster/RosterFlatEditor.tsx
import { useState } from "react";
import type { MemberRoster, RosterMember } from "../../domain/memberRoster";
import type { DepartmentKey } from "../../domain/reportTypes";

type Props = {
  deptKey: Exclude<DepartmentKey, "adult">;
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

export function RosterFlatEditor({ deptKey, roster, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const dept = roster.departments[deptKey];
  const members: RosterMember[] = dept.kind === "flat" ? dept.members : [];

  function updateMembers(next: RosterMember[]) {
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        [deptKey]: { kind: "flat", members: next },
      },
      updatedAt: new Date().toISOString(),
    });
  }

  function handleAdd() {
    const name = draft.trim();
    if (!name) return;
    updateMembers([...members, { id: crypto.randomUUID(), name }]);
    setDraft("");
  }

  function handleDelete(id: string) {
    updateMembers(members.filter(m => m.id !== id));
  }

  return (
    <div className="roster-flat-editor">
      <ul className="roster-member-list">
        {members.map(m => (
          <li key={m.id} className="roster-member-item">
            <span>{m.name}</span>
            <button
              type="button"
              className="roster-delete-btn"
              aria-label={`${m.name} 삭제`}
              onClick={() => handleDelete(m.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      <div className="roster-add-row">
        <input
          aria-label="이름 입력"
          value={draft}
          placeholder="이름 입력"
          onChange={e => setDraft(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
          }}
        />
        <button type="button" onClick={handleAdd}>추가</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.roster-flat-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roster-member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.roster-member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f7f8f5;
  border-radius: 6px;
  font-size: 14px;
}

.roster-delete-btn {
  background: transparent;
  border: 1px solid #d9ded6;
  color: #5e6b65;
  font-size: 11px;
  padding: 2px 8px;
  font-weight: 500;
}

.roster-add-row {
  display: flex;
  gap: 6px;
}

.roster-add-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d9ded6;
  border-radius: 6px;
  font-size: 14px;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/roster/RosterFlatEditor.tsx src/styles.css
git commit -m "feat: add RosterFlatEditor for flat departments"
```

---

## Task 6: RosterZoneEditor (장년)

**Files:**
- Create: `src/features/roster/RosterZoneEditor.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/features/roster/RosterZoneEditor.tsx
import { useState } from "react";
import type { MemberRoster, RosterZone } from "../../domain/memberRoster";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

function ZoneSection({
  zone,
  onUpdate,
}: {
  zone: RosterZone;
  onUpdate: (next: RosterZone) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const name = draft.trim();
    if (!name) return;
    onUpdate({
      ...zone,
      members: [...zone.members, { id: crypto.randomUUID(), name, role: "member" }],
    });
    setDraft("");
  }

  function handleDelete(id: string) {
    onUpdate({ ...zone, members: zone.members.filter(m => m.id !== id) });
  }

  const roleLabel = (role?: string) =>
    role === "leader" ? " (장)" : role === "inspector" ? " (권)" : "";

  return (
    <div className="roster-zone-section">
      <div className="roster-zone-header">{zone.name}</div>
      <ul className="roster-member-list">
        {zone.members.map(m => (
          <li key={m.id} className="roster-member-item">
            <span>{m.name}{roleLabel(m.role)}</span>
            {m.role === "member" && (
              <button
                type="button"
                className="roster-delete-btn"
                aria-label={`${m.name} 삭제`}
                onClick={() => handleDelete(m.id)}
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="roster-add-row">
        <input
          aria-label={`${zone.name} 이름 입력`}
          value={draft}
          placeholder="이름 입력"
          onChange={e => setDraft(e.currentTarget.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
        />
        <button type="button" onClick={handleAdd}>추가</button>
      </div>
    </div>
  );
}

export function RosterZoneEditor({ roster, onChange }: Props) {
  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return null;
  const zones = adult.zones;
  const districts = [...new Set(zones.map(z => z.district))].sort();

  function handleZoneUpdate(updatedZone: RosterZone) {
    const nextZones = zones.map(z => z.id === updatedZone.id ? updatedZone : z);
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        adult: { kind: "zoned", zones: nextZones },
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="roster-zone-editor">
      {districts.map(district => (
        <div key={district} className="roster-district-section">
          <div className="roster-district-header">{district}교구</div>
          {zones.filter(z => z.district === district).map(zone => (
            <ZoneSection
              key={zone.id}
              zone={zone}
              onUpdate={handleZoneUpdate}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.roster-zone-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.roster-district-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.roster-district-header {
  font-weight: 700;
  font-size: 14px;
  color: #24564a;
  padding: 4px 0;
  border-bottom: 2px solid #24564a;
}

.roster-zone-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 8px;
}

.roster-zone-header {
  font-weight: 600;
  font-size: 13px;
  color: #374740;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/roster/RosterZoneEditor.tsx src/styles.css
git commit -m "feat: add RosterZoneEditor for adult zones"
```

---

## Task 7: MemberRosterTab (탭 조립)

**Files:**
- Create: `src/features/roster/MemberRosterTab.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/features/roster/MemberRosterTab.tsx
import { useState } from "react";
import type { MemberRoster } from "../../domain/memberRoster";
import type { DepartmentKey } from "../../domain/reportTypes";
import { PhoneNumberManager } from "./PhoneNumberManager";
import { RosterFlatEditor } from "./RosterFlatEditor";
import { RosterZoneEditor } from "./RosterZoneEditor";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

const DEPT_TABS: { key: DepartmentKey; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "장년" },
];

export function MemberRosterTab({ roster, onChange }: Props) {
  const [activeDept, setActiveDept] = useState<DepartmentKey>("elementary");

  return (
    <div className="roster-tab">
      <div className="segmented-control roster-dept-tabs" aria-label="부서 선택">
        {DEPT_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={activeDept === key}
            onClick={() => setActiveDept(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="roster-dept-content">
        {activeDept === "adult" ? (
          <RosterZoneEditor roster={roster} onChange={onChange} />
        ) : (
          <RosterFlatEditor
            deptKey={activeDept as Exclude<DepartmentKey, "adult">}
            roster={roster}
            onChange={onChange}
          />
        )}
      </div>

      <PhoneNumberManager roster={roster} onChange={onChange} />
    </div>
  );
}
```

- [ ] **Step 2: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.roster-tab {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.roster-dept-tabs {
  margin-bottom: 16px;
}

.roster-dept-content {
  min-height: 200px;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/roster/MemberRosterTab.tsx src/styles.css
git commit -m "feat: add MemberRosterTab assembling department editors"
```

---

## Task 8: App.tsx — roster 로드 + 명단관리 탭 추가

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: App.tsx에 roster 상태 및 로드 추가**

기존 import에 추가:
```typescript
import type { MemberRoster } from "./domain/memberRoster";
import { loadRoster, saveRoster } from "./storage/memberRosterStore";
import { MemberRosterTab } from "./features/roster/MemberRosterTab";
```

App 컴포넌트 상태에 추가:
```typescript
const [mode, setMode] = useState<"edit" | "view" | "roster">("edit");
const [roster, setRoster] = useState<MemberRoster | undefined>();
```

`createEmptyReport()` 호출 변경 (초기 상태):
```typescript
const [report, setReport] = useState(() => createEmptyReport());
```
그대로 유지 (roster가 로드되기 전 기본값 사용).

- [ ] **Step 2: loadInitialState에 roster 로드 추가**

```typescript
async function loadInitialState() {
  const [storedReports, storedAccounts] = await Promise.all([
    listReports(),
    listAccounts(),
  ]);
  const draft = readReportDraft();
  const latest = latestReport(storedReports);
  const accountId = localStorage.getItem(CURRENT_ACCOUNT_ID_KEY);
  const storedAccount = storedAccounts.find(a => a.id === accountId);

  // roster 로드
  const storedRoster = storedAccount
    ? await loadRoster(storedAccount.email)
    : undefined;

  if (!isMounted) return;

  setReports(sortReports(storedReports));
  setAccounts(storedAccounts);
  if (storedAccount) setCurrentAccount(storedAccount);
  if (storedRoster) setRoster(storedRoster);

  const initialReport = draft ?? latest;
  if (initialReport) {
    const upgradedReport = upgradeReportForEditor(initialReport);
    setReport(storedAccount && !upgradedReport.pastorName
      ? reportWithAccount(upgradedReport, storedAccount)
      : upgradedReport);
  }
  setIsHydrated(true);
}
```

- [ ] **Step 3: handleNewReport에 roster 전달**

```typescript
function handleNewReport() {
  const nextReport = createEmptyReport(new Date(), roster);
  const draft = currentAccount
    ? reportWithAccount(nextReport, currentAccount)
    : nextReport;
  setReport(draft);
  saveReportDraft(draft);
  setSaveErrors([]);
  setSaveStatus("새 보고서를 만들었습니다.");
}
```

- [ ] **Step 4: roster onChange 핸들러 추가**

```typescript
function handleRosterChange(nextRoster: MemberRoster) {
  setRoster(nextRoster);
  if (currentAccount) {
    void saveRoster(currentAccount.email, nextRoster);
  }
}
```

- [ ] **Step 5: UI에 탭 버튼과 MemberRosterTab 추가**

`segmented-control` div에 버튼 추가:
```tsx
<div className="segmented-control" aria-label="보기 모드">
  <button type="button" aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>
    보고서
  </button>
  <button type="button" aria-pressed={mode === "view"} onClick={() => setMode("view")}>
    뷰어
  </button>
  <button type="button" aria-pressed={mode === "roster"} onClick={() => setMode("roster")}>
    명단관리
  </button>
</div>
```

`mode === "edit"` 블록 아래에 추가:
```tsx
) : mode === "roster" ? (
  <main className="roster-shell">
    <MemberRosterTab
      roster={roster ?? createDefaultRoster()}
      onChange={handleRosterChange}
    />
  </main>
) : (
  <ReportViewer report={report} />
)}
```

import에 `createDefaultRoster` 추가:
```typescript
import { createDefaultRoster } from "./domain/memberRoster";
```

- [ ] **Step 6: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.roster-shell {
  padding: 20px;
  max-width: 680px;
  margin: 0 auto;
}
```

- [ ] **Step 7: 빌드 및 단위 테스트 통과 확인**

```bash
npm run build && npm test
```

Expected: TypeScript 에러 없음, 22 tests passed

- [ ] **Step 8: 커밋**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add 명단관리 tab with roster load/save to App"
```

---

## Task 9: SMS 유틸리티

**Files:**
- Create: `src/features/report/smsUtils.ts`
- Create: `src/features/report/smsUtils.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```typescript
// src/features/report/smsUtils.test.ts
import { describe, expect, it } from "vitest";
import { buildZoneSmsMessage, buildDistrictSmsMessage } from "./smsUtils";
import type { DepartmentZone } from "../../domain/reportTypes";

const makeZone = (name: string, district: number, members: { name: string; status: "present" | "absent"; role?: string }[]): DepartmentZone => ({
  id: "z1",
  name,
  district,
  members: members.map((m, i) => ({ id: `m${i}`, ...m })),
});

describe("buildZoneSmsMessage", () => {
  it("returns empty string when no absentees", () => {
    const zone = makeZone("1구역", 1, [{ name: "홍길동", status: "present" }]);
    expect(buildZoneSmsMessage(zone, "2026-05-07")).toBe("");
  });

  it("returns formatted message with absentees", () => {
    const zone = makeZone("1구역", 1, [
      { name: "홍길동", status: "absent" },
      { name: "김철수", status: "absent" },
      { name: "이영희", status: "present" },
    ]);
    const msg = buildZoneSmsMessage(zone, "2026-05-07");
    expect(msg).toContain("[2026-05-07 주일 결석 현황]");
    expect(msg).toContain("1구역 결석자 2명");
    expect(msg).toContain("홍길동 김철수");
    expect(msg).not.toContain("이영희");
  });
});

describe("buildDistrictSmsMessage", () => {
  it("returns empty string when no absentees in district", () => {
    const zones = [makeZone("1구역", 1, [{ name: "홍길동", status: "present" }])];
    expect(buildDistrictSmsMessage(1, zones, "2026-05-07")).toBe("");
  });

  it("returns formatted district message", () => {
    const zones = [
      makeZone("1구역", 1, [{ name: "홍길동", status: "absent" }]),
      makeZone("2구역", 1, [{ name: "김철수", status: "absent" }, { name: "이영희", status: "present" }]),
    ];
    const msg = buildDistrictSmsMessage(1, zones, "2026-05-07");
    expect(msg).toContain("[2026-05-07 주일 결석 현황]");
    expect(msg).toContain("1교구 총 결석 2명");
    expect(msg).toContain("1구역: 홍길동");
    expect(msg).toContain("2구역: 김철수");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --reporter=verbose src/features/report/smsUtils.test.ts
```

Expected: FAIL (파일 없음)

- [ ] **Step 3: 유틸리티 구현**

```typescript
// src/features/report/smsUtils.ts
import type { DepartmentZone } from "../../domain/reportTypes";

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function buildZoneSmsMessage(zone: DepartmentZone, date: string): string {
  const absent = zone.members.filter(m => m.status === "absent");
  if (!absent.length) return "";
  const names = absent.map(m => m.name).join(" ");
  return `[${date} 주일 결석 현황]\n${zone.name} 결석자 ${absent.length}명\n${names}`;
}

export function buildDistrictSmsMessage(
  district: number,
  zones: DepartmentZone[],
  date: string,
): string {
  const districtZones = zones.filter(z => z.district === district);
  const lines = districtZones
    .filter(z => z.members.some(m => m.status === "absent"))
    .map(z => {
      const names = z.members.filter(m => m.status === "absent").map(m => m.name).join(" ");
      return `${z.name}: ${names}`;
    });
  if (!lines.length) return "";
  const total = districtZones.reduce(
    (sum, z) => sum + z.members.filter(m => m.status === "absent").length,
    0,
  );
  return `[${date} 주일 결석 현황]\n${district}교구 총 결석 ${total}명\n\n${lines.join("\n")}`;
}

export type SmsTarget = {
  id: string;
  label: string;
  leaderName: string;
  phone: string | undefined;
  msg: string;
};

export function buildSmsTargets(zones: DepartmentZone[], reportDate: string): SmsTarget[] {
  const targets: SmsTarget[] = [];

  // 구역별
  zones.forEach((zone, i) => {
    const msg = buildZoneSmsMessage(zone, reportDate);
    if (!msg) return;
    const leader = zone.members.find(m => m.role === "leader");
    targets.push({
      id: `z${i}`,
      label: zone.name,
      leaderName: `${zone.name}장 ${leader?.name ?? ""}`,
      phone: leader?.phone,
      msg,
    });
  });

  // 교구별 (district 1, 2)
  [1, 2].forEach(district => {
    const distZones = zones.filter(z => z.district === district);
    const msg = buildDistrictSmsMessage(district, zones, reportDate);
    if (!msg) return;
    // 교구장 = 해당 district의 첫 번째 zone leader
    const firstZone = distZones[0];
    const leader = firstZone?.members.find(m => m.role === "leader");
    targets.push({
      id: `d${district}`,
      label: `${district}교구 전체`,
      leaderName: `${district}교구장 ${leader?.name ?? ""}`,
      phone: leader?.phone,
      msg,
    });
  });

  return targets;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --reporter=verbose src/features/report/smsUtils.test.ts
```

Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/features/report/smsUtils.ts src/features/report/smsUtils.test.ts
git commit -m "feat: add SMS utilities with message builders and target builder"
```

---

## Task 10: SmsPanel 컴포넌트

**Files:**
- Create: `src/features/report/SmsPanel.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/features/report/SmsPanel.tsx
import { useState } from "react";
import type { DepartmentZone } from "../../domain/reportTypes";
import { buildSmsTargets, isMobile, type SmsTarget } from "./smsUtils";

type Props = {
  zones: DepartmentZone[];
  reportDate: string;
  onClose: () => void;
};

export function SmsPanel({ zones, reportDate, onClose }: Props) {
  const allTargets = buildSmsTargets(zones, reportDate);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [queueIdx, setQueueIdx] = useState<number | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const pending = allTargets.filter(t => t.phone && !sentIds.has(t.id));
  const currentTarget: SmsTarget | null =
    queueIdx !== null ? (pending[queueIdx] ?? null) : null;

  function openSms(target: SmsTarget) {
    if (!isMobile()) {
      alert("이 기능은 모바일에서만 사용할 수 있습니다.");
      return;
    }
    window.location.href = `sms:${target.phone}?body=${encodeURIComponent(target.msg)}`;
  }

  function startQueue() {
    if (!pending.length) return;
    setQueueIdx(0);
    setAwaitingConfirm(false);
    openSms(pending[0]);
    setAwaitingConfirm(true);
  }

  function markSent(id: string) {
    const next = new Set(sentIds);
    next.add(id);
    setSentIds(next);
    advanceQueue();
  }

  function markUnsent() {
    advanceQueue();
  }

  function advanceQueue() {
    setAwaitingConfirm(false);
    const nextIdx = (queueIdx ?? 0) + 1;
    const remaining = pending.filter(t => !sentIds.has(t.id));
    if (nextIdx >= remaining.length) {
      setQueueIdx(null);
      return;
    }
    setQueueIdx(nextIdx);
    setTimeout(() => {
      const next = remaining[nextIdx];
      if (next) { openSms(next); setAwaitingConfirm(true); }
    }, 200);
  }

  function stopQueue() {
    setQueueIdx(null);
    setAwaitingConfirm(false);
  }

  const isQueueActive = queueIdx !== null;
  const zoneTargets = allTargets.filter(t => t.id.startsWith("z"));
  const distTargets = allTargets.filter(t => t.id.startsWith("d"));
  const missingPhone = allTargets.filter(t => !t.phone);

  return (
    <div className="sms-panel" role="dialog" aria-label="문자 발송">
      <div className="sms-panel-header">
        <span>📱 문자 발송</span>
        <button type="button" className="sms-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="sms-panel-controls">
        <button
          type="button"
          className="btn-sms-all"
          disabled={isQueueActive || !pending.length}
          onClick={startQueue}
        >
          📤 전체 순차 전송
        </button>
        {isQueueActive && (
          <button type="button" className="btn-sms-stop" onClick={stopQueue}>⏹</button>
        )}
        <span className="sms-progress">
          {isQueueActive ? `${(queueIdx ?? 0) + 1}/${pending.length}` : ""}
        </span>
      </div>

      {missingPhone.length > 0 && (
        <p className="sms-missing-warning">
          ⚠️ 번호 미등록: {missingPhone.map(t => t.label).join(", ")}
        </p>
      )}

      <p className="sms-summary">
        전송완료 {sentIds.size}/{allTargets.length}
      </p>

      {awaitingConfirm && currentTarget && (
        <div className="sms-confirm-bar">
          문자앱 전송 후 돌아와서 확인해주세요.
          <button type="button" className="btn-sms-confirm" onClick={() => markSent(currentTarget.id)}>
            ✅ 전송완료
          </button>
          <button type="button" className="btn-sms-skip" onClick={markUnsent}>
            ↩️ 미전송
          </button>
        </div>
      )}

      <div className="sms-section-label">── 구역장 개별 전송 ──</div>
      {zoneTargets.map(t => (
        <SmsItem
          key={t.id}
          target={t}
          sent={sentIds.has(t.id)}
          isCurrent={isQueueActive && awaitingConfirm && currentTarget?.id === t.id}
          onOpen={() => openSms(t)}
          onMarkSent={() => markSent(t.id)}
        />
      ))}

      {distTargets.length > 0 && (
        <>
          <div className="sms-section-label">── 교구장 전체 결석자 전송 ──</div>
          {distTargets.map(t => (
            <SmsItem
              key={t.id}
              target={t}
              sent={sentIds.has(t.id)}
              isCurrent={isQueueActive && awaitingConfirm && currentTarget?.id === t.id}
              onOpen={() => openSms(t)}
              onMarkSent={() => markSent(t.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SmsItem({
  target,
  sent,
  isCurrent,
  onOpen,
  onMarkSent,
}: {
  target: SmsTarget;
  sent: boolean;
  isCurrent: boolean;
  onOpen: () => void;
  onMarkSent: () => void;
}) {
  return (
    <div className={`sms-item${sent ? " sent" : ""}${isCurrent ? " current" : ""}${!target.phone ? " no-phone" : ""}`}>
      <div className="sms-item-header">
        <span className="sms-item-label">{target.label}</span>
        <span className="sms-item-leader">{target.leaderName}</span>
      </div>
      <pre className="sms-item-msg">{target.msg}</pre>
      <div className="sms-item-actions">
        {sent ? (
          <span className="sms-sent-badge">✓ 전송완료</span>
        ) : target.phone ? (
          <>
            <button type="button" className="btn-sms-open" onClick={onOpen}>📨 문자앱 열기</button>
            <button type="button" className="btn-sms-confirm-manual" onClick={onMarkSent}>✅ 수동완료</button>
          </>
        ) : (
          <span className="sms-no-phone">⚙️ 명단관리에서 번호 입력 필요</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.sms-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 75vh;
  overflow-y: auto;
  background: #ffffff;
  border-top: 2px solid #24564a;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  box-shadow: 0 -4px 24px rgba(23, 33, 29, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sms-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 15px;
  color: #24564a;
}

.sms-panel-close {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #5e6b65;
  padding: 4px 8px;
  font-weight: 400;
}

.sms-panel-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sms-all {
  background: #24564a;
  color: #fff;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
}

.btn-sms-all:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-sms-stop {
  background: transparent;
  border: 1px solid #d9ded6;
  color: #5e6b65;
  font-size: 18px;
  padding: 4px 10px;
}

.sms-progress {
  font-size: 13px;
  color: #5e6b65;
}

.sms-missing-warning {
  font-size: 12px;
  color: #975a16;
  background: #fffbeb;
  border: 1px solid #f6e05e;
  border-radius: 6px;
  padding: 8px 10px;
  margin: 0;
  white-space: pre-wrap;
}

.sms-summary {
  font-size: 12px;
  color: #5e6b65;
  margin: 0;
}

.sms-confirm-bar {
  background: #e5f1ed;
  border: 1px solid #9ecfc2;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sms-confirm {
  background: #24564a;
  color: #fff;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

.btn-sms-skip {
  background: transparent;
  border: 1px solid #d9ded6;
  color: #5e6b65;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

.sms-section-label {
  font-size: 12px;
  font-weight: 600;
  color: #24564a;
  margin: 4px 0;
}

.sms-item {
  border: 1px solid #d9ded6;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sms-item.sent {
  opacity: 0.55;
  background: #f7f8f5;
}

.sms-item.current {
  border-color: #24564a;
  background: #e5f1ed;
}

.sms-item.no-phone {
  background: #fffbeb;
}

.sms-item-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sms-item-label {
  font-weight: 700;
  font-size: 13px;
}

.sms-item-leader {
  font-size: 12px;
  color: #5e6b65;
}

.sms-item-msg {
  font-size: 12px;
  color: #374740;
  white-space: pre-wrap;
  font-family: inherit;
  background: #f7f8f5;
  border-radius: 4px;
  padding: 6px 8px;
  margin: 0;
}

.sms-item-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-sms-open {
  background: #24564a;
  color: #fff;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

.btn-sms-confirm-manual {
  background: transparent;
  border: 1px solid #24564a;
  color: #24564a;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

.sms-sent-badge {
  font-size: 12px;
  color: #24564a;
  font-weight: 600;
}

.sms-no-phone {
  font-size: 12px;
  color: #975a16;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/report/SmsPanel.tsx src/styles.css
git commit -m "feat: add SmsPanel with sequential queue and desktop warning"
```

---

## Task 11: ZonedDepartmentAttendanceEditor에 문자 발송 버튼 연결

**Files:**
- Modify: `src/features/report/ZonedDepartmentAttendanceEditor.tsx`

- [ ] **Step 1: 문자 발송 버튼 + SmsPanel 추가**

`ZonedDepartmentAttendanceEditor.tsx` 상단 import에 추가:
```typescript
import { useState } from "react";
import { SmsPanel } from "./SmsPanel";
import { isMobile } from "./smsUtils";
```

`ZonedDepartmentAttendanceEditor` 함수 내 상태 추가:
```typescript
const [showSms, setShowSms] = useState(false);
```

JSX 반환 맨 아래, `</div>` 닫기 전에 추가:
```tsx
      <div className="sms-button-row">
        <button
          type="button"
          className="btn-sms-trigger"
          onClick={() => {
            if (!isMobile()) {
              alert("이 기능은 모바일에서만 사용할 수 있습니다.");
              return;
            }
            setShowSms(true);
          }}
        >
          📱 문자 발송
        </button>
      </div>

      {showSms && (
        <SmsPanel
          zones={zones}
          reportDate={new Date().toISOString().slice(0, 10)}
          onClose={() => setShowSms(false)}
        />
      )}
```

- [ ] **Step 2: reportDate를 prop으로 받도록 수정**

SmsPanel에 정확한 보고일을 전달하려면 `department` 대신 부모로부터 받아야 한다. 현재 구조상 `DepartmentReport`에는 보고일이 없으므로 `ZonedDepartmentAttendanceEditor` Props에 추가:

```typescript
type Props = {
  department: DepartmentReport;
  reportDate: string;                    // 추가
  onChange: (key: DepartmentKey, next: DepartmentReport) => void;
};
```

`SmsPanel` 호출:
```tsx
<SmsPanel
  zones={zones}
  reportDate={reportDate}
  onClose={() => setShowSms(false)}
/>
```

`ReportForm.tsx`에서 `DepartmentAttendanceEditor` 호출부에 reportDate 전달:

`ReportForm.tsx`의 props에 reportDate 받기:
```typescript
// ReportForm.tsx 상단
export function ReportForm({ report, onChange }: ReportFormProps) {
```
변경 없음. 단, DepartmentAttendanceEditor 호출 시:
```tsx
<DepartmentAttendanceEditor
  department={department}
  reportDate={report.reportDate}    // 추가
  onChange={(nextKey, nextDepartment) => updateDepartment(nextKey, nextDepartment)}
/>
```

`DepartmentAttendanceEditor.tsx`의 Props와 내부에서 ZonedDepartmentAttendanceEditor로 reportDate 전달:
```typescript
type DepartmentAttendanceEditorProps = {
  department: DepartmentReport;
  reportDate: string;              // 추가
  onChange: (key: DepartmentKey, nextDepartment: DepartmentReport) => void;
};

// 함수 내부
if (hasZones(department)) {
  return <ZonedDepartmentAttendanceEditor department={department} reportDate={reportDate} onChange={onChange} />;
}
```

- [ ] **Step 3: CSS 추가** (`src/styles.css` 끝에 추가)

```css
.sms-button-row {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}

.btn-sms-trigger {
  background: #24564a;
  color: #fff;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: TypeScript 에러 없음

- [ ] **Step 5: 단위 + smoke 테스트 통과 확인**

```bash
npm run verify
```

Expected: 22 unit tests passed, 43 smoke tests passed

- [ ] **Step 6: 커밋**

```bash
git add src/features/report/ZonedDepartmentAttendanceEditor.tsx \
        src/features/report/DepartmentAttendanceEditor.tsx \
        src/features/report/ReportForm.tsx \
        src/styles.css
git commit -m "feat: wire SMS panel to ZonedDepartmentAttendanceEditor"
```

---

## 최종 검증

- [ ] **빌드 및 전체 테스트**

```bash
npm run verify
```

Expected: 모든 단위 테스트 + 43 smoke tests passed

- [ ] **수동 확인 항목**
  - [ ] 명단관리 탭 → 유초등부 멤버 추가/삭제 → 새 보고서 생성 시 반영 확인
  - [ ] 명단관리 탭 → 장년 → 전화번호 관리 → 입력/수정 동작 확인
  - [ ] 보고서 편집 → 장년 구역에서 결석 설정 후 [📱 문자 발송] 클릭
    - 데스크탑: "이 기능은 모바일에서만 사용할 수 있습니다." alert 확인
    - 모바일: SMS 패널 열림, 구역장 및 교구장 발송 대상 확인
