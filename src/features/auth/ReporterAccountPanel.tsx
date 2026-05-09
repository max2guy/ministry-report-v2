import type { Account } from "../../auth/authTypes";

type ReporterAccountPanelProps = {
  currentAccount?: Account;
  onSignOut: () => void;
};

export function ReporterAccountPanel({
  currentAccount,
  onSignOut,
}: ReporterAccountPanelProps) {
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
    </section>
  );
}
