import { useState } from "react";
import type { ByeolmyeongbuReason, MemberRoster, RosterZone } from "../../domain/memberRoster";
import { moveToByeolmyeongbu } from "../../domain/memberRoster";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

type ByeolStep = null | { memberId: string };

function ZoneSection({
  zone,
  onUpdate,
  onMoveToByeolmyeongbu,
}: {
  zone: RosterZone;
  onUpdate: (next: RosterZone) => void;
  onMoveToByeolmyeongbu: (memberId: string, reason: ByeolmyeongbuReason) => void;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [byeolStep, setByeolStep] = useState<ByeolStep>(null);

  function handleAdd() {
    const name = draft.trim();
    if (!name) return;
    const newMember = { id: crypto.randomUUID(), name, role: "member" as const };
    // 구역장·권찰은 현 위치 유지, 일반 구역원만 가나다순 정렬 후 뒤에 배치
    const fixed = zone.members.filter((m) => m.role === "leader" || m.role === "inspector");
    const regular = zone.members
      .filter((m) => m.role !== "leader" && m.role !== "inspector")
      .concat(newMember)
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    onUpdate({ ...zone, members: [...fixed, ...regular] });
    setDraft("");
  }

  function handleDelete(id: string) {
    onUpdate({ ...zone, members: zone.members.filter((m) => m.id !== id) });
  }

  function handleByeolConfirm(memberId: string, reason: ByeolmyeongbuReason) {
    onMoveToByeolmyeongbu(memberId, reason);
    setByeolStep(null);
  }

  const roleLabel = (role?: string) =>
    role === "leader" ? " (장)" : role === "inspector" ? " (권)" : "";

  const REASONS: ByeolmyeongbuReason[] = ["타교", "요양", "장기결석", "소재불명"];

  return (
    <div className="roster-zone-section">
      <button
        type="button"
        className="roster-zone-header roster-zone-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{zone.name}</span>
        <span className="roster-zone-count">{zone.members.length}명</span>
        <span className="roster-zone-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <ul className="roster-member-list">
            {zone.members.map((m) => (
              <li key={m.id} className="roster-member-item">
                {byeolStep?.memberId === m.id ? (
                  <div className="byeol-reason-picker">
                    <span className="byeol-reason-label">{m.name} 사유:</span>
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="byeol-reason-btn"
                        onClick={() => handleByeolConfirm(m.id, r)}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="byeol-cancel-btn"
                      onClick={() => setByeolStep(null)}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{m.name}{roleLabel(m.role)}</span>
                    <div className="roster-member-actions">
                      <button
                        type="button"
                        className="byeol-move-btn"
                        aria-label={`${m.name} 별명부로 이동`}
                        onClick={() => setByeolStep({ memberId: m.id })}
                      >
                        별명부
                      </button>
                      <button
                        type="button"
                        className="roster-delete-btn"
                        aria-label={`${m.name} 삭제`}
                        onClick={() => handleDelete(m.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="roster-add-row">
            <input
              aria-label={`${zone.name} 이름 입력`}
              value={draft}
              placeholder="이름 입력"
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <button type="button" onClick={handleAdd}>
              추가
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RosterZoneEditor({ roster, onChange }: Props) {
  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return null;
  const seenNames = new Set<string>();
  const zones = adult.zones.filter((z) => {
    if (seenNames.has(z.name)) return false;
    seenNames.add(z.name);
    return true;
  });
  const districts = [...new Set(zones.map((z) => z.district))].sort();

  function handleZoneUpdate(updatedZone: RosterZone) {
    const nextZones = zones.map((z) => (z.id === updatedZone.id ? updatedZone : z));
    onChange({
      ...roster,
      departments: {
        ...roster.departments,
        adult: { kind: "zoned", zones: nextZones },
      },
      updatedAt: new Date().toISOString(),
    });
  }

  function handleMoveToByeolmyeongbu(memberId: string, reason: ByeolmyeongbuReason) {
    onChange(moveToByeolmyeongbu(roster, memberId, reason));
  }

  return (
    <div className="roster-zone-editor">
      {districts.map((district) => (
        <div key={district} className="roster-district-section">
          <div className="roster-district-header">{district}교구</div>
          {zones
            .filter((z) => z.district === district)
            .map((zone) => (
              <ZoneSection
                key={zone.id}
                zone={zone}
                onUpdate={handleZoneUpdate}
                onMoveToByeolmyeongbu={(memberId, reason) =>
                  handleMoveToByeolmyeongbu(memberId, reason)
                }
              />
            ))}
        </div>
      ))}
    </div>
  );
}
