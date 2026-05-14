import type { DepartmentKey } from "../domain/reportTypes";
import type { Account } from "./authTypes";
import { isSuperAdmin } from "./authTypes";

export type Permissions = {
  canCreateReport: boolean;
  canEditReport: boolean;
  /** 보고서 탭에서 편집 가능한 부서. "all"이면 전체. */
  editableDepts: DepartmentKey[] | "all";
  /** 보고서 탭·명단 탭에서 보이는 부서. "all"이면 전체. */
  visibleDepts: DepartmentKey[] | "all";
  canAccessRoster: boolean;
  canManageUsers: boolean;
};

const DENY_ALL: Permissions = {
  canCreateReport: false,
  canEditReport: false,
  editableDepts: "all",
  visibleDepts: "all",
  canAccessRoster: false,
  canManageUsers: false,
};

const ALLOW_ALL: Permissions = {
  canCreateReport: true,
  canEditReport: true,
  editableDepts: "all",
  visibleDepts: "all",
  canAccessRoster: true,
  canManageUsers: false,
};

export function usePermissions(account: Account | null | undefined): Permissions {
  if (!account) return DENY_ALL;

  if (isSuperAdmin(account)) {
    return { ...ALLOW_ALL, canManageUsers: true };
  }

  if (account.role === "admin") {
    return ALLOW_ALL;
  }

  if (account.role === "deptManager") {
    const depts = account.departments ?? [];
    return {
      canCreateReport: true,
      canEditReport: true,
      editableDepts: depts,
      visibleDepts: depts,
      canAccessRoster: true,
      canManageUsers: false,
    };
  }

  // viewer (기본값, 레거시 "reporter" 포함)
  return {
    canCreateReport: false,
    canEditReport: false,
    editableDepts: "all",
    visibleDepts: "all",
    canAccessRoster: false,
    canManageUsers: false,
  };
}
