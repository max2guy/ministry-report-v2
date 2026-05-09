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
  const isTempPassword = account.status === "mustChangePassword";
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
      setMessage(isTempPassword ? "새 비밀번호를 확인해 주세요." : "현재 비밀번호가 맞지 않습니다.");
    }
  }

  return (
    <form className="password-change-panel" onSubmit={handleSubmit}>
      <strong>{isTempPassword ? "임시 비밀번호 — 새 비밀번호를 설정해 주세요" : "비밀번호 변경"}</strong>
      {!isTempPassword && (
        <label>
          현재 비밀번호
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
          />
        </label>
      )}
      <label>
        새 비밀번호 (8자 이상)
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
