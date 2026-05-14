import { useState } from "react";
import type { Account } from "../../auth/authTypes";
import { updateDisplayName } from "../../auth/firebaseAuthStore";

type ReporterAccountPanelProps = {
  currentAccount?: Account;
  onSignOut: () => void;
  onDisplayNameChange?: (newName: string) => void;
};

export function ReporterAccountPanel({
  currentAccount,
  onSignOut,
  onDisplayNameChange,
}: ReporterAccountPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  if (!currentAccount) return null;

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === currentAccount!.displayName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await updateDisplayName(currentAccount!.id, trimmed);
    onDisplayNameChange?.(trimmed);
    setSaving(false);
    setEditing(false);
  }

  return (
    <section className="account-panel" aria-label="보고자 계정">
      <h2>보고자 계정</h2>
      <div className="account-card">
        {editing ? (
          <div className="account-name-edit">
            <input
              autoFocus
              value={draft}
              placeholder="이름 입력"
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "저장 중…" : "저장"}
            </button>
            <button type="button" onClick={() => setEditing(false)}>취소</button>
          </div>
        ) : (
          <div className="account-name-row">
            <strong>{currentAccount.displayName}</strong>
            <button
              type="button"
              className="btn-edit-name"
              onClick={() => { setDraft(currentAccount.displayName); setEditing(true); }}
            >
              이름 변경
            </button>
          </div>
        )}
        <span>{currentAccount.email}</span>
        <button type="button" onClick={onSignOut}>
          로그아웃
        </button>
      </div>
    </section>
  );
}
