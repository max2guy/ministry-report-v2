import { useState } from "react";
import type { MemberRoster } from "../../domain/memberRoster";
import type { DepartmentKey } from "../../domain/reportTypes";
import { ByeolmyeongbuEditor } from "./ByeolmyeongbuEditor";
import { PhoneNumberManager } from "./PhoneNumberManager";
import { RosterFlatEditor } from "./RosterFlatEditor";
import { RosterZoneEditor } from "./RosterZoneEditor";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
  visibleDepts: DepartmentKey[] | "all";
};

const DEPT_TABS: { key: DepartmentKey; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

/** 교구 전체 명단을 구역별 텍스트로 변환 (별명부 포함) */
function buildAdultRosterText(roster: MemberRoster): string {
  const adult = roster.departments.adult;
  if (adult.kind !== "zoned") return "";
  const role = (r?: string) => (r === "leader" ? "(장)" : r === "inspector" ? "(권)" : "");
  const lines = adult.zones.map(
    (z) => `${z.name} (${z.members.length}명): ${z.members.map((m) => m.name + role(m.role)).join(", ")}`,
  );
  const byeol = roster.byeolmyeongbu ?? [];
  if (byeol.length) {
    lines.push(`별명부 (${byeol.length}명): ${byeol.map((m) => `${m.name}[${m.reason}]`).join(", ")}`);
  }
  return lines.join("\n");
}

export function MemberRosterTab({ roster, onChange, visibleDepts }: Props) {
  const filteredTabs = DEPT_TABS.filter(({ key }) =>
    visibleDepts === "all" || visibleDepts.includes(key),
  );

  const [activeDept, setActiveDept] = useState<DepartmentKey>(
    filteredTabs[0]?.key ?? "elementary",
  );

  const [copyMsg, setCopyMsg] = useState("");
  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(buildAdultRosterText(roster));
      setCopyMsg("복사되었습니다.");
    } catch {
      setCopyMsg("복사에 실패했습니다.");
    }
    setTimeout(() => setCopyMsg(""), 2500);
  }

  return (
    <div className="roster-tab">
      <div className="segmented-control roster-dept-tabs" aria-label="부서 선택">
        {filteredTabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={activeDept === key}
            onClick={() => setActiveDept(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="roster-dept-content">
        {activeDept === "adult" ? (
          <RosterZoneEditor roster={roster} onChange={onChange} />
        ) : (
          <RosterFlatEditor
            deptKey={activeDept as Exclude<DepartmentKey, "adult">}
            roster={roster}
            onChange={onChange}
          />
        )}
      </div>

      {activeDept === "adult" && (
        <>
          <ByeolmyeongbuEditor roster={roster} onChange={onChange} />
          <button type="button" onClick={handleCopyText}>
            명단 텍스트 복사 {copyMsg}
          </button>
          <PhoneNumberManager roster={roster} onChange={onChange} />
        </>
      )}
    </div>
  );
}
