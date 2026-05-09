import { useState } from "react";
import type { MemberRoster, RosterZone } from "../../domain/memberRoster";

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
            <span className="phone-manager-zone">{zone.name}장</span>
            <span className="phone-manager-name">{leaders[i]?.name ?? "-"}</span>
            {openIdx === i ? (
              <span className="phone-manager-input-row">
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
                <button type="button" onClick={() => handleSave(i)}>저장</button>
                <button type="button" className="btn-cancel" onClick={() => { setOpenIdx(null); setDraft(""); }}>취소</button>
              </span>
            ) : (
              <button
                type="button"
                className="phone-manager-edit-btn"
                onClick={() => handleOpen(i)}
              >
                {leaders[i]?.phone ? "수정" : "입력"}
              </button>
            )}
          </li>
        ))}
      </ul>
      </>}
    </section>
  );
}
