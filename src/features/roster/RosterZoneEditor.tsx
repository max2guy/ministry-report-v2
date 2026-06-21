import { useState } from "react";
import type { MemberRoster, RosterZone } from "../../domain/memberRoster";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

function ZoneSection({
  zone,
  onUpdate,
}: {
  zone: RosterZone;
  onUpdate: (next: RosterZone) => void;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  function handleAdd() {
    const name = draft.trim();
    if (!name) return;
    const next = [...zone.members, { id: crypto.randomUUID(), name, role: "member" as const }];
    next.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    onUpdate({ ...zone, members: next });
    setDraft("");
  }

  function handleDelete(id: string) {
    onUpdate({ ...zone, members: zone.members.filter(m => m.id !== id) });
  }

  const roleLabel = (role?: string) =>
    role === "leader" ? " (장)" : role === "inspector" ? " (권)" : "";

  return (
    <div className="roster-zone-section">
      <button
        type="button"
        className="roster-zone-header roster-zone-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{zone.name}</span>
        <span className="roster-zone-count">{zone.members.length}명</span>
        <span className="roster-zone-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <ul className="roster-member-list">
            {zone.members.map(m => (
              <li key={m.id} className="roster-member-item">
                <span>{m.name}{roleLabel(m.role)}</span>
                <button
                  type="button"
                  className="roster-delete-btn"
                  aria-label={`${m.name} 삭제`}
                  onClick={() => handleDelete(m.id)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <div className="roster-add-row">
            <input
              aria-label={`${zone.name} 이름 입력`}
              value={draft}
              placeholder="이름 입력"
              onChange={e => setDraft(e.currentTarget.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            />
            <button type="button" onClick={handleAdd}>추가</button>
          </div>
        </>
      )}
    </div>
  );
}

export function RosterZoneEditor({ roster, onChange }: Props) {
  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return null;
  // 이름 기준 중복 제거 (Firestore에 이미 중복 저장된 경우 방어)
  const seenNames = new Set<string>();
  const zones = adult.zones.filter((z) => {
    if (seenNames.has(z.name)) return false;
    seenNames.add(z.name);
    return true;
  });
  const districts = [...new Set(zones.map(z => z.district))].sort();

  function handleZoneUpdate(updatedZone: RosterZone) {
    const nextZones = zones.map(z => z.id === updatedZone.id ? updatedZone : z);
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        adult: { kind: "zoned", zones: nextZones },
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="roster-zone-editor">
      {districts.map(district => (
        <div key={district} className="roster-district-section">
          <div className="roster-district-header">{district}교구</div>
          {zones.filter(z => z.district === district).map(zone => (
            <ZoneSection
              key={zone.id}
              zone={zone}
              onUpdate={handleZoneUpdate}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
