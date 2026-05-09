import { useState, useEffect } from "react";
import {
  getStoredPat,
  storePat,
  getStoredGistId,
  validatePat,
} from "./githubGistBackup";

export function GithubSettingsPanel() {
  const [pat, setPat] = useState(getStoredPat());
  const [gistId, setGistId] = useState("");
  const [status, setStatus] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    getStoredGistId()
      .then(setGistId)
      .catch(() => setGistId(""));
  }, []);

  async function handleSavePat() {
    setValidating(true);
    setStatus("");
    const valid = await validatePat(pat);
    if (valid) {
      storePat(pat);
      setStatus("✓ PAT 저장됨");
    } else {
      setStatus("✗ PAT가 유효하지 않습니다.");
    }
    setValidating(false);
  }

  return (
    <section className="github-settings-panel" aria-label="GitHub 백업 설정">
      <h2>GitHub 백업 설정 (관리자)</h2>
      <div className="github-settings-row">
        <label htmlFor="github-pat">PAT</label>
        <input
          id="github-pat"
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="ghp_..."
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => void handleSavePat()}
          disabled={validating || !pat}
        >
          {validating ? "확인 중..." : "저장"}
        </button>
      </div>
      {gistId && (
        <p className="github-gist-id">
          Gist: <code>{gistId.slice(0, 8)}…</code> ✓ 연결됨
        </p>
      )}
      {status && (
        <p role="status" className="github-status">
          {status}
        </p>
      )}
    </section>
  );
}
