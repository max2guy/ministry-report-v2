import { useState } from "react";
import type { Account } from "../../auth/authTypes";
import { setTemporaryPassword } from "../../auth/internalAuthStore";

type AdminRecoveryPanelProps = {
  account: Account;
  onRecovered: (account: Account) => void;
};

function accountStatusLabel(account: Account): string {
  return account.status === "mustChangePassword" ? "비밀번호 변경 필요" : "정상";
}

export function AdminRecoveryPanel({
  account,
  onRecovered,
}: AdminRecoveryPanelProps) {
  const [temporaryPassword, setTemporaryPasswordValue] = useState("");
  const [message, setMessage] = useState("");

  async function handleReset() {
    try {
      const updated = await setTemporaryPassword(account, temporaryPassword);
      setTemporaryPasswordValue("");
      setMessage("임시 비밀번호가 설정되었습니다.");
      onRecovered(updated);
    } catch {
      setMessage("8자 이상의 임시 비밀번호를 입력해 주세요.");
    }
  }

  return (
    <section className="admin-panel" aria-label="비밀번호 복구">
      <h2>비밀번호 복구</h2>
      <p>{account.email}</p>
      <p className="account-status" aria-label="복구 계정 상태">
        {accountStatusLabel(account)}
      </p>
      <label>
        임시 비밀번호
        <input
          type="password"
          value={temporaryPassword}
          onChange={(event) =>
            setTemporaryPasswordValue(event.currentTarget.value)
          }
        />
      </label>
      <button type="button" onClick={handleReset}>
        임시 비밀번호 설정
      </button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
