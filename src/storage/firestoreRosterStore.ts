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

export async function firestoreLoadRoster(): Promise<MemberRoster | undefined> {
  const snap = await getDoc(doc(db, "roster", "shared"));
  if (!snap.exists()) return undefined;

  const deduped = deduplicateRoster(snap.data() as MemberRoster);
  const { roster: fixed, changed } = fixKnownNameTypos(deduped);

  // 오타가 교정됐으면 Firestore에 즉시 반영
  if (changed) {
    await setDoc(doc(db, "roster", "shared"), fixed);
  }

  return fixed;
}

export async function firestoreSaveRoster(roster: MemberRoster): Promise<void> {
  await setDoc(doc(db, "roster", "shared"), roster);
}
