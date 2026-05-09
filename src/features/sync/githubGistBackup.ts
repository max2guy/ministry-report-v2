import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { MinistryReport } from "../../domain/reportTypes";
import type { MemberRoster } from "../../domain/memberRoster";

const PAT_KEY = "github-gist-pat";

export function getStoredPat(): string {
  return localStorage.getItem(PAT_KEY) ?? "";
}

export function storePat(pat: string): void {
  if (pat) {
    localStorage.setItem(PAT_KEY, pat);
  } else {
    localStorage.removeItem(PAT_KEY);
  }
}

export async function getStoredGistId(): Promise<string> {
  const snap = await getDoc(doc(db, "settings", "github"));
  return snap.exists() ? ((snap.data().gistId as string) ?? "") : "";
}

async function storeGistId(gistId: string): Promise<void> {
  await setDoc(doc(db, "settings", "github"), {
    gistId,
    updatedAt: new Date().toISOString(),
  });
}

type GistPayload = {
  reports: MinistryReport[];
  roster: MemberRoster | undefined;
};

/** Gist 업로드. PAT 없으면 no-op. 실패해도 에러를 던지지 않음. */
export async function uploadToGist(payload: GistPayload): Promise<void> {
  const pat = getStoredPat();
  if (!pat) return;

  const gistId = await getStoredGistId().catch(() => "");
  const files = {
    "reports.json": { content: JSON.stringify(payload.reports, null, 2) },
    "roster.json": {
      content: JSON.stringify(payload.roster ?? {}, null, 2),
    },
  };

  try {
    if (gistId) {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });
    } else {
      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "사역보고서 v2 백업",
          public: false,
          files,
        }),
      });
      const data = (await res.json()) as { id?: string };
      if (data.id) {
        await storeGistId(data.id);
      }
    }
  } catch (err) {
    console.warn("GitHub Gist backup failed:", err);
  }
}

/** PAT 유효성 검증 */
export async function validatePat(pat: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${pat}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
