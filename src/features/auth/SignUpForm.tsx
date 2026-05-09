import { useState, type FormEvent } from "react";
import type { Account } from "../../auth/authTypes";
import { createAccount } from "../../auth/internalAuthStore";

type SignUpFormProps = {
  onCreated: (account: Account) => void;
};

export function SignUpForm({ onCreated }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const account = await createAccount({ email, displayName, password });
      setEmail("");
      setDisplayName("");
      setPassword("");
      setError("");
      onCreated(account);
    } catch (error) {
      setError(
        error instanceof Error && error.message === "DUPLICATE_EMAIL"
          ? "이미 등록된 이메일입니다."
          : "이메일 또는 비밀번호를 확인해 주세요.",
      );
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        이름
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
        />
      </label>
      <label>
        이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
      </label>
      <button type="submit">계정 생성</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
