import { useState, type FormEvent } from "react";
import type { Account } from "../../auth/authTypes";
import { authenticateAccount } from "../../auth/internalAuthStore";

type SignInFormProps = {
  onSignedIn: (account: Account) => void;
};

export function SignInForm({ onSignedIn }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const account = await authenticateAccount({ email, password });
      setEmail("");
      setPassword("");
      setError("");
      onSignedIn(account);
    } catch {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        로그인 이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
      </label>
      <label>
        로그인 비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
      </label>
      <button type="submit">로그인</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
