import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MemberRoster } from "../domain/memberRoster";

const DOC_PATH = "roster/shared";

export async function firestoreLoadRoster(): Promise<MemberRoster | undefined> {
  const snap = await getDoc(doc(db, "roster", "shared"));
  if (!snap.exists()) return undefined;
  return snap.data() as MemberRoster;
}

export async function firestoreSaveRoster(roster: MemberRoster): Promise<void> {
  await setDoc(doc(db, "roster", "shared"), roster);
}
