import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { Account, UserRole } from "./authTypes";
import type { DepartmentKey } from "../domain/reportTypes";

const provider = new GoogleAuthProvider();

/** Firestore users/{uid} 문서를 읽거나 없으면 생성 */
export async function getOrCreateUserDoc(user: User): Promise<Account> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    const rawRole = data.role as string;
    // 레거시 "reporter" → "viewer" 취급 (Firestore 값 변경 없음)
    const role: UserRole =
      rawRole === "reporter" || rawRole === "viewer"
        ? "viewer"
        : rawRole === "admin"
          ? "admin"
          : rawRole === "deptManager"
            ? "deptManager"
            : "viewer";
    return {
      id: user.uid,
      email: user.email ?? "",
      displayName: (data.displayName as string) || user.displayName || "",
      role,
      departments: (data.departments as DepartmentKey[]) ?? undefined,
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

/** 모든 사용자 문서 조회 (최고관리자 전용) */
export async function listAllUsers(): Promise<Account[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    const rawRole = data.role as string;
    const role: UserRole =
      rawRole === "admin" ? "admin"
      : rawRole === "deptManager" ? "deptManager"
      : "viewer";
    return {
      id: d.id,
      email: (data.email as string) ?? "",
      displayName: (data.displayName as string) ?? "",
      role,
      departments: (data.departments as DepartmentKey[]) ?? undefined,
      createdAt: (data.createdAt as string) ?? "",
      updatedAt: (data.updatedAt as string) ?? "",
    };
  });
}

/** 사용자 역할 변경 (최고관리자 전용) */
export async function updateUserRole(
  uid: string,
  role: UserRole,
  departments?: DepartmentKey[],
): Promise<void> {
  const ref = doc(db, "users", uid);
  const now = new Date().toISOString();
  if (role === "deptManager") {
    await updateDoc(ref, { role, departments: departments ?? [], updatedAt: now });
  } else {
    await updateDoc(ref, { role, departments: deleteField(), updatedAt: now });
  }
}
