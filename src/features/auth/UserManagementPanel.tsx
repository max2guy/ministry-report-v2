import { useEffect, useState } from "react";
import type { Account, UserRole } from "../../auth/authTypes";
import { isSuperAdmin } from "../../auth/authTypes";
import { listAllUsers, updateUserRole } from "../../auth/firebaseAuthStore";
import type { DepartmentKey } from "../../domain/reportTypes";

const DEPT_OPTIONS: { key: DepartmentKey; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "viewer", label: "열람자" },
  { value: "deptManager", label: "부서관리자" },
  { value: "admin", label: "관리자" },
];

type Props = {
  currentAccount: Account;
};

export function UserManagementPanel({ currentAccount }: Props) {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAllUsers()
      .then((list) => {
        // 최고관리자를 맨 위로, 나머지는 이름순
        list.sort((a, b) => {
          if (isSuperAdmin(a)) return -1;
          if (isSuperAdmin(b)) return 1;
          return a.displayName.localeCompare(b.displayName, "ko");
        });
        setUsers(list);
      })
      .catch(() => setError("사용자 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(user: Account, role: UserRole) {
    const prevUsers = users;
    const depts = role === "deptManager" ? (user.departments ?? []) : undefined;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role, departments: depts } : u)),
    );
    try {
      await updateUserRole(user.id, role, depts);
      setError(null);
    } catch {
      setError("권한 변경에 실패했습니다.");
      setUsers(prevUsers);
    }
  }

  async function handleDeptToggle(user: Account, dept: DepartmentKey) {
    const prevUsers = users;
    const current = user.departments ?? [];
    const next = current.includes(dept)
      ? current.filter((d) => d !== dept)
      : [...current, dept];
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, departments: next } : u)),
    );
    try {
      await updateUserRole(user.id, "deptManager", next);
      setError(null);
    } catch {
      setError("부서 변경에 실패했습니다.");
      setUsers(prevUsers);
    }
  }

  return (
    <section className="user-mgmt-panel">
      <h3 className="user-mgmt-title">사용자 관리</h3>
      {loading && <p className="user-mgmt-loading">불러오는 중…</p>}
      {error && <p className="user-mgmt-error">{error}</p>}
      <ul className="user-mgmt-list">
        {users.map((user) => {
          const isSelf = user.id === currentAccount.id;
          const isSuper = isSuperAdmin(user);
          return (
            <li key={user.id} className="user-mgmt-item">
              <div className="user-mgmt-info">
                <span className="user-mgmt-name">
                  {user.displayName || "이름 없음"}
                </span>
                <span className="user-mgmt-email">{user.email}</span>
              </div>
              {isSuper || isSelf ? (
                <span className="user-mgmt-role-badge">
                  {isSuper ? "최고관리자" : "내 계정"}
                </span>
              ) : (
                <div className="user-mgmt-controls">
                  <select
                    className="user-mgmt-role-select"
                    value={user.role}
                    aria-label={`${user.displayName} 역할`}
                    onChange={(e) =>
                      void handleRoleChange(user, e.currentTarget.value as UserRole)
                    }
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {user.role === "deptManager" && (
                    <div className="user-mgmt-depts">
                      {DEPT_OPTIONS.map(({ key, label }) => (
                        <label key={key} className="user-mgmt-dept-check">
                          <input
                            type="checkbox"
                            checked={(user.departments ?? []).includes(key)}
                            onChange={() => void handleDeptToggle(user, key)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
