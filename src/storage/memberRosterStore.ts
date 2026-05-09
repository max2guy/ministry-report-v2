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
