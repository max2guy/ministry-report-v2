import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MinistryReport } from "../domain/reportTypes";

const COLLECTION = "reports";

/**
 * Firestore는 undefined 필드값을 거부한다.
 * JSON 직렬화로 undefined를 제거한 뒤 저장한다.
 */
function sanitize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function firestoreListReports(): Promise<MinistryReport[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as MinistryReport);
}

export async function firestoreSaveReport(report: MinistryReport): Promise<void> {
  const ref = doc(db, COLLECTION, report.id);
  await setDoc(ref, sanitize(report));
}

export async function firestoreSaveReports(reports: MinistryReport[]): Promise<void> {
  const batch = writeBatch(db);
  for (const report of reports) {
    const ref = doc(db, COLLECTION, report.id);
    batch.set(ref, sanitize(report));
  }
  await batch.commit();
}

export async function firestoreDeleteReport(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
