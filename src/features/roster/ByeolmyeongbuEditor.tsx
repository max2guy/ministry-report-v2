import type { MemberRoster } from "../../domain/memberRoster";
import { restoreFromByeolmyeongbu } from "../../domain/memberRoster";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

export function ByeolmyeongbuEditor({ roster, onChange }: Props) {
  const members = roster.byeolmyeongbu ?? [];
  if (members.length === 0) return null;

  const adult = roster.departments.adult;

  function handleRestore(memberId: string) {
    const entry = members.find((m) => m.id === memberId);
    if (!entry) return;

    let toZoneId = entry.fromZoneId;
    if (adult.kind === "zoned") {
      const found = adult.zones.find((z) => z.id === entry.fromZoneId);
      if (!found && adult.zones.length > 0) toZoneId = adult.zones[0].id;
    }

    onChange(restoreFromByeolmyeongbu(roster, memberId, toZoneId));
  }

  function handleDelete(memberId: string) {
    onChange({
      ...roster,
      byeolmyeongbu: members.filter((m) => m.id !== memberId),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="byeolmyeongbu-section">
      <div className="byeolmyeongbu-header">
        별명부 <span className="byeolmyeongbu-count">{members.length}명</span>
      </div>
      <ul className="byeolmyeongbu-list">
        {members.map((m) => (
          <li key={m.id} className="byeolmyeongbu-item">
            <span className="byeolmyeongbu-name">{m.name}</span>
            <span className="byeolmyeongbu-reason">{m.reason}</span>
            <span className="byeolmyeongbu-zone">{m.fromZoneName}</span>
            <div className="byeolmyeongbu-actions">
              <button
                type="button"
                className="byeolmyeongbu-restore-btn"
                onClick={() => handleRestore(m.id)}
              >
                복귀
              </button>
              <button
                type="button"
                className="byeolmyeongbu-delete-btn"
                onClick={() => handleDelete(m.id)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
