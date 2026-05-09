import { useMemo, useState } from "react";
import type { Account } from "../../auth/authTypes";
import { AccountLookupForm } from "./AccountLookupForm";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

type AuthTabKey = "signin" | "signup" | "lookup";

type AuthGateProps = {
  onCreated: (account: Account) => void;
  onSignedIn: (account: Account) => void;
};

const AUTH_TABS: { key: AuthTabKey; label: string }[] = [
  { key: "signin", label: "로그인" },
  { key: "signup", label: "계정 생성" },
  { key: "lookup", label: "계정 찾기" },
];

export function AuthGate({ onCreated, onSignedIn }: AuthGateProps) {
  const [tab, setTab] = useState<AuthTabKey>("signin");
  const activeTab = useMemo(
    () => AUTH_TABS.find((item) => item.key === tab) ?? AUTH_TABS[0],
    [tab],
  );

  return (
    <section className="auth-gate">
      <div className="auth-gate-panel">
        <p className="auth-gate-badge">연천장로교회</p>
        <h1>사역보고서 v2</h1>
        <h2>{activeTab.label}</h2>
        <p className="auth-gate-copy">
          로그인 후 사역보고서를 작성하고 저장된 보고서를 확인할 수 있습니다.
        </p>
        <div className="auth-tabs" role="tablist" aria-label="인증 메뉴">
          {AUTH_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className="auth-tab"
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="auth-tab-panel"
          role="tabpanel"
          aria-label={activeTab.label}
        >
          {tab === "signin" ? <SignInForm onSignedIn={onSignedIn} /> : null}
          {tab === "signup" ? <SignUpForm onCreated={onCreated} /> : null}
          {tab === "lookup" ? <AccountLookupForm /> : null}
        </div>
      </div>
    </section>
  );
}
