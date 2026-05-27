import type { Account } from "../../auth/authTypes";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthGateProps = {
  onSignedIn: (account: Account) => void;
};

export function AuthGate({ onSignedIn }: AuthGateProps) {
  return (
    <div className="auth-gate-v2">
      <div className="auth-gate-banner">
        <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="사역보고서" className="auth-gate-banner-icon" />
        <h1 className="auth-gate-title">연천장로교회<br />사역보고서</h1>
        <p className="auth-gate-subtitle">주일 사역 출결 · 현황 보고</p>
      </div>
      <div className="auth-gate-card-wrapper">
        <div className="auth-gate-card">
          <p className="auth-gate-card-heading">시작하기</p>
          <p className="auth-gate-card-desc">Google 계정으로 로그인하세요</p>
          <GoogleSignInButton onSignedIn={onSignedIn} />
          <p className="auth-gate-card-hint">첫 번째 로그인 계정이 관리자가 됩니다</p>
        </div>
      </div>
    </div>
  );
}
