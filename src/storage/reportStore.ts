import { openDB } from "idb";
import type { MinistryReport } from "../domain/reportTypes";

const DB_NAME = "ministry-report-v2";
const STORE_NAME = "reports";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });
}

export async function saveReport(report: MinistryReport): Promise<void> {
  const database = await db();
  await database.put(STORE_NAME, report);
}

export async function saveReports(reports: MinistryReport[]): Promise<void> {
  const database = await db();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  await Promise.all(reports.map((report) => transaction.store.put(report)));
  await transaction.done;
}

export async function deleteReport(id: string): Promise<void> {
  const database = await db();
  await database.delete(STORE_NAME, id);
}

export async function getReport(
  id: string,
): Promise<MinistryReport | undefined> {
  const database = await db();
  return database.get(STORE_NAME, id);
}

export async function listReports(): Promise<MinistryReport[]> {
  const database = await db();
  return database.getAll(STORE_NAME);
}
