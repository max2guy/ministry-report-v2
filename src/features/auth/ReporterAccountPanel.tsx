import { useState } from "react";
import type { Account } from "../../auth/authTypes";
import { PasswordChangePanel } from "./PasswordChangePanel";

type ReporterAccountPanelProps = {
  currentAccount?: Account;
  onAccountChanged: (account: Account) => void;
  onSignOut: () => void;
};

export function ReporterAccountPanel({
  currentAccount,
  onAccountChanged,
  onSignOut,
}: ReporterAccountPanelProps) {
  const [message, setMessage] = useState("");

  function handleAccountChanged(account: Account) {
    setMessage("비밀번호가 변경되었습니다.");
    onAccountChanged(account);
  }

  if (!currentAccount) return null;

  return (
    <section className="account-panel" aria-label="보고자 계정">
      <h2>보고자 계정</h2>
      <div className="account-card">
        <strong>{currentAccount.displayName}</strong>
        <span>{currentAccount.email}</span>
        <button type="button" onClick={onSignOut}>
          로그아웃
        </button>
      </div>

      {currentAccount?.status === "mustChangePassword" ? (
        <PasswordChangePanel
          account={currentAccount}
          onChanged={handleAccountChanged}
        />
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
