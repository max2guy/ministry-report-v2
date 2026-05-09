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

export async function firestoreListReports(): Promise<MinistryReport[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as MinistryReport);
}

export async function firestoreSaveReport(report: MinistryReport): Promise<void> {
  const ref = doc(db, COLLECTION, report.id);
  await setDoc(ref, report);
}

export async function firestoreSaveReports(reports: MinistryReport[]): Promise<void> {
  const batch = writeBatch(db);
  for (const report of reports) {
    const ref = doc(db, COLLECTION, report.id);
    batch.set(ref, report);
  }
  await batch.commit();
}

export async function firestoreDeleteReport(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
