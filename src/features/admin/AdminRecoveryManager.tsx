import { useState } from "react";
import type { Account } from "../../auth/authTypes";
import { AdminRecoveryPanel } from "./AdminRecoveryPanel";

type AdminRecoveryManagerProps = {
  accounts: Account[];
  onRecovered: (account: Account) => void;
};

function accountStatusLabel(account: Account): string {
  return account.status === "mustChangePassword" ? "비밀번호 변경 필요" : "정상";
}

export function AdminRecoveryManager({
  accounts,
  onRecovered,
}: AdminRecoveryManagerProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId,
  );

  return (
    <section className="admin-manager" aria-label="관리자 복구">
      <h2>관리자 복구</h2>
      {accounts.length ? (
        <label>
          복구 대상
          <select
            value={selectedAccountId}
            onChange={(event) => setSelectedAccountId(event.currentTarget.value)}
          >
            <option value="">선택</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName} ({account.email}) -{" "}
                {accountStatusLabel(account)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="helper-text">복구할 계정이 없습니다.</p>
      )}
      {selectedAccount ? (
        <AdminRecoveryPanel
          account={selectedAccount}
          onRecovered={onRecovered}
        />
      ) : null}
    </section>
  );
}
