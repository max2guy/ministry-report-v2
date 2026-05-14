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

export async function firestoreLoadRoster(): Promise<MemberRoster | undefined> {
  const snap = await getDoc(doc(db, "roster", "shared"));
  if (!snap.exists()) return undefined;
  return deduplicateRoster(snap.data() as MemberRoster);
}

export async function firestoreSaveRoster(roster: MemberRoster): Promise<void> {
  await setDoc(doc(db, "roster", "shared"), roster);
}
