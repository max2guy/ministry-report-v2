import { useState, type FormEvent } from "react";
import {
  findAccountByNameAndEmail,
  maskEmail,
} from "../../auth/internalAuthStore";

export function AccountLookupForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const account = await findAccountByNameAndEmail({ displayName, email });
    if (!account) {
      setMessage("");
      setError("일치하는 계정을 찾지 못했습니다.");
      return;
    }

    setError("");
    setMessage(`가입 이메일: ${maskEmail(account.email)}`);
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
        가입 이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
      </label>
      <button type="submit">계정 확인</button>
      <p className="helper-text">비밀번호는 관리자 복구가 필요합니다.</p>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
