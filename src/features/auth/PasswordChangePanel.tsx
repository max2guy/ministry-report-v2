import { useState, type FormEvent } from "react";
import type { Account } from "../../auth/authTypes";
import { changePassword } from "../../auth/internalAuthStore";

type PasswordChangePanelProps = {
  account: Account;
  onChanged: (account: Account) => void;
};

export function PasswordChangePanel({
  account,
  onChanged,
}: PasswordChangePanelProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const updated = await changePassword({
        account,
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("비밀번호가 변경되었습니다.");
      onChanged(updated);
    } catch {
      setMessage("비밀번호를 확인해 주세요.");
    }
  }

  return (
    <form className="password-change-panel" onSubmit={handleSubmit}>
      <strong>비밀번호 변경 필요</strong>
      <label>
        현재/임시 비밀번호
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.currentTarget.value)}
        />
      </label>
      <label>
        새 비밀번호
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.currentTarget.value)}
        />
      </label>
      <button type="submit">비밀번호 변경</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
