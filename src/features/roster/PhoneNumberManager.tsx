import { useState } from "react";
import type { MemberRoster, RosterZone } from "../../domain/memberRoster";

// Contact Picker API — 표준 TS lib에 미포함이므로 최소 선언
interface ContactAddress { tel: string[] }
interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactAddress[]>;
}
declare global {
  interface Navigator { contacts?: ContactsManager; }
}

/** Contact Picker API 지원 여부 */
function canPickContact(): boolean {
  return typeof navigator !== "undefined" && "contacts" in navigator;
}

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

function getZones(roster: MemberRoster): RosterZone[] {
  const adult = roster.departments.adult;
  return adult.kind === "zoned" ? adult.zones : [];
}

export function PhoneNumberManager({ roster, onChange }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);

  async function handlePickContact() {
    if (!canPickContact()) return;
    try {
      setPicking(true);
      const contacts = await navigator.contacts!.select(["tel"], { multiple: false });
      if (contacts.length > 0 && contacts[0].tel.length > 0) {
        const raw = contacts[0].tel[0].replace(/[^0-9]/g, "");
        // 010-XXXX-XXXX 형식으로 포맷
        const formatted = raw.length === 11
          ? `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`
          : raw.length === 10
            ? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
            : raw;
        setDraft(formatted);
      }
    } catch {
      // 사용자 취소 등 — 무시
    } finally {
      setPicking(false);
    }
  }

  const zones = getZones(roster);
  const leaders = zones.map(z => z.members.find(m => m.role === "leader"));

  function handleOpen(i: number) {
    setOpenIdx(i);
    setDraft(leaders[i]?.phone ?? "");
  }

  function handleSave(i: number) {
    const formatted = draft.trim().replace(/[^0-9-]/g, "");
    const adult = roster.departments.adult;
    if (adult.kind !== "zoned") return;
    const nextZones = adult.zones.map((z, zi) =>
      zi !== i ? z : {
        ...z,
        members: z.members.map(m =>
          m.role === "leader" ? { ...m, phone: formatted || undefined } : m
        ),
      }
    );
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        adult: { kind: "zoned", zones: nextZones },
      },
      updatedAt: new Date().toISOString(),
    });
    setOpenIdx(null);
    setDraft("");
  }

  return (
    <section className="phone-manager">
      <button
        type="button"
        className="phone-manager-toggle"
        onClick={() => setExpanded(o => !o)}
        aria-expanded={expanded}
      >
        <span>전화번호 관리</span>
        <span className="roster-zone-chevron">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && <>
      <p className="phone-manager-desc">구역장 전화번호 (문자 발송에 사용)</p>
      <ul className="phone-manager-list">
        {zones.map((zone, i) => (
          <li key={zone.id} className="phone-manager-item">
            {/* 윗 줄: 구역명 / 구역장 이름 / (비편집 시) 입력·수정 버튼 */}
            <div className="phone-manager-top-row">
              <span className="phone-manager-zone">{zone.name}장</span>
              <span className="phone-manager-name">{leaders[i]?.name ?? "-"}</span>
              {openIdx !== i && (
                <button
                  type="button"
                  className="phone-manager-edit-btn"
                  onClick={() => handleOpen(i)}
                >
                  {leaders[i]?.phone ? "수정" : "입력"}
                </button>
              )}
            </div>
            {/* 아랫 줄: 편집 시에만 표시되는 입력 행 */}
            {openIdx === i && (
              <div className="phone-manager-input-row">
                <input
                  type="tel"
                  aria-label={`${zone.name}장 전화번호`}
                  value={draft}
                  placeholder="010-0000-0000"
                  onChange={e => setDraft(e.currentTarget.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); handleSave(i); }
                    if (e.key === "Escape") { setOpenIdx(null); setDraft(""); }
                  }}
                  autoFocus
                />
                {canPickContact() && (
                  <button
                    type="button"
                    className="phone-manager-contact-btn"
                    disabled={picking}
                    aria-label="주소록에서 불러오기"
                    onClick={handlePickContact}
                  >
                    {picking ? "…" : "주소록"}
                  </button>
                )}
                <button type="button" onClick={() => handleSave(i)}>저장</button>
                <button type="button" className="btn-cancel" onClick={() => { setOpenIdx(null); setDraft(""); }}>취소</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      </>}
    </section>
  );
}
