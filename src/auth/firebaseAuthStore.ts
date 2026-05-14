import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { Account, UserRole } from "./authTypes";

const provider = new GoogleAuthProvider();

/** Firestore users/{uid} 문서를 읽거나 없으면 생성 */
export async function getOrCreateUserDoc(user: User): Promise<Account> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: user.uid,
      email: user.email ?? "",
      displayName: (data.displayName as string) || user.displayName || "",
      role: (data.role as UserRole) ?? "viewer",
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string,
    };
  }

  // 첫 사용자인지 확인 (users 컬렉션이 비어있으면 admin)
  const allUsers = await getDocs(collection(db, "users"));
  const role: UserRole = allUsers.empty ? "admin" : "viewer";

  const now = new Date().toISOString();
  const account: Account = {
    id: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    role,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, {
    displayName: account.displayName,
    email: account.email,
    role: account.role,
    createdAt: now,
    updatedAt: now,
  });

  return account;
}

/** Google 팝업 로그인 → Account 반환 */
export async function signInWithGoogle(): Promise<Account> {
  const result = await signInWithPopup(auth, provider);
  return getOrCreateUserDoc(result.user);
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Auth 상태 변경 구독. 반환값은 unsubscribe 함수 */
export function onAuthChange(
  callback: (account: Account | null) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback(null);
      return;
    }
    getOrCreateUserDoc(user)
      .then(callback)
      .catch(() => callback(null));
  });
}

/** displayName 업데이트 */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { displayName, updatedAt: new Date().toISOString() });
}
