import type { Account } from "../../auth/authTypes";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthGateProps = {
  onCreated: (account: Account) => void;
  onSignedIn: (account: Account) => void;
};

export function AuthGate({ onSignedIn }: AuthGateProps) {
  // onCreated is kept for API compatibility but unused — Google sign-in auto-creates accounts
  return (
    <section className="auth-gate">
      <div className="auth-gate-panel">
        <p className="auth-gate-badge">연천장로교회</p>
        <h1>사역보고서 v2</h1>
        <p className="auth-gate-copy">
          Google 계정으로 로그인하면 어느 기기에서든 보고서를 확인할 수 있습니다.
        </p>
        <GoogleSignInButton onSignedIn={onSignedIn} />
      </div>
    </section>
  );
}
