import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MemberRoster } from "../domain/memberRoster";

/** 로드된 roster의 교구 구역 중복을 이름 기준으로 제거 */
function deduplicateRoster(roster: MemberRoster): MemberRoster {
  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return roster;

  const seen = new Set<string>();
  const deduped = adult.zones.filter((z) => {
    if (seen.has(z.name)) return false;
    seen.add(z.name);
    return true;
  });

  if (deduped.length === adult.zones.length) return roster;
  return {
    ...roster,
    departments: {
      ...roster.departments,
      adult: { kind: "zoned", zones: deduped },
    },
  };
}

/**
 * 알려진 이름 오타를 교정한다.
 * 교정이 발생하면 { roster, changed: true }를 반환해 저장 트리거.
 */
function fixKnownNameTypos(
  roster: MemberRoster,
): { roster: MemberRoster; changed: boolean } {
  // { 오타: 정타 } 맵
  const FIXES: Record<string, string> = {
    "윤승희": "윤승휘",
  };

  let changed = false;

  const fixDepts = (depts: MemberRoster["departments"]): MemberRoster["departments"] => {
    const result = { ...depts };
    for (const key of ["elementary", "middleHigh", "youngAdult"] as const) {
      const dept = depts[key];
      if (dept.kind !== "flat") continue;
      const fixed = dept.members.map((m) => {
        const corrected = FIXES[m.name];
        if (corrected) { changed = true; return { ...m, name: corrected }; }
        return m;
      });
      result[key] = { ...dept, members: fixed };
    }
    const adult = depts.adult;
    if (adult.kind === "zoned") {
      const fixedZones = adult.zones.map((z) => ({
        ...z,
        members: z.members.map((m) => {
          const corrected = FIXES[m.name];
          if (corrected) { changed = true; return { ...m, name: corrected }; }
          return m;
        }),
      }));
      result.adult = { kind: "zoned", zones: fixedZones };
    }
    return result;
  };

  const fixedRoster: MemberRoster = {
    ...roster,
    departments: fixDepts(roster.departments),
  };
  return { roster: fixedRoster, changed };
}

/**
 * 6구역 구역원 순서를 사용자가 지정한 순서로 교정한다.
 * 구역장·권찰은 그대로 두고, 나머지 구역원만 지정된 순서로 재배치.
 * 교정이 발생하면 { roster, changed: true }를 반환해 저장 트리거.
 */
function fixZone6MemberOrder(
  roster: MemberRoster,
): { roster: MemberRoster; changed: boolean } {
  const DESIRED_ORDER = [
    "김덕희", "김은주", "신영락", "노학심", "박순영", "변기성",
    "이순희", "박종학", "이춘생", "최봉석", "윤숙경", "최태인",
  ];

  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return { roster, changed: false };

  let changed = false;
  const fixedZones = adult.zones.map((z) => {
    if (z.name !== "6구역") return z;

    const rolePriority = (role?: string) => (role === "leader" ? 0 : role === "inspector" ? 1 : 2);
    const fixed = z.members
      .filter((m) => m.role === "leader" || m.role === "inspector")
      .sort((a, b) => rolePriority(a.role) - rolePriority(b.role));
    const regular = z.members.filter(
      (m) => m.role !== "leader" && m.role !== "inspector",
    );
    const byName = new Map(regular.map((m) => [m.name, m]));
    const reordered = DESIRED_ORDER.map((name) => byName.get(name)).filter(
      (m): m is (typeof regular)[number] => m !== undefined,
    );
    // 지정 순서에 없는 나머지 구역원은 뒤에 그대로 유지
    const leftover = regular.filter((m) => !DESIRED_ORDER.includes(m.name));
    const nextMembers = [...fixed, ...reordered, ...leftover];

    const sameOrder =
      nextMembers.length === z.members.length &&
      nextMembers.every((m, i) => m.id === z.members[i].id);
    if (!sameOrder) changed = true;

    return { ...z, members: nextMembers };
  });

  if (!changed) return { roster, changed: false };
  return {
    roster: {
      ...roster,
      departments: { ...roster.departments, adult: { kind: "zoned", zones: fixedZones } },
    },
    changed: true,
  };
}

export async function firestoreLoadRoster(): Promise<MemberRoster | undefined> {
  const snap = await getDoc(doc(db, "roster", "shared"));
  if (!snap.exists()) return undefined;

  const deduped = deduplicateRoster(snap.data() as MemberRoster);
  const { roster: fixedTypos, changed: typoChanged } = fixKnownNameTypos(deduped);
  const { roster: fixed, changed: orderChanged } = fixZone6MemberOrder(fixedTypos);

  // 교정이 발생했으면 Firestore에 즉시 반영
  if (typoChanged || orderChanged) {
    await setDoc(doc(db, "roster", "shared"), fixed);
  }

  return fixed;
}

export async function firestoreSaveRoster(roster: MemberRoster): Promise<void> {
  await setDoc(doc(db, "roster", "shared"), roster);
}
