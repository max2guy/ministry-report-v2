import type { DepartmentKey } from "../domain/reportTypes";

export type UserRole = "viewer" | "deptManager" | "admin";
// "reporter"는 레거시값 — 코드에서 "viewer"로 취급, Firestore 마이그레이션 없음

export type Account = {
  id: string;          // Firebase uid
  email: string;
  displayName: string;
  role: UserRole;
  departments?: DepartmentKey[];  // deptManager 전용: 담당 부서 키 배열
  createdAt: string;
  updatedAt: string;
};

/** max2guy@gmail.com 여부를 런타임에 결정 — Firestore에 저장하지 않음 */
export function isSuperAdmin(account: Account | null | undefined): boolean {
  return account?.email === "max2guy@gmail.com";
}
