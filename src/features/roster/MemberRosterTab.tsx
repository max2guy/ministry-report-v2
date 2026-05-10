import { useState } from "react";
import type { MemberRoster } from "../../domain/memberRoster";
import type { DepartmentKey } from "../../domain/reportTypes";
import { PhoneNumberManager } from "./PhoneNumberManager";
import { RosterFlatEditor } from "./RosterFlatEditor";
import { RosterZoneEditor } from "./RosterZoneEditor";

type Props = {
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

const DEPT_TABS: { key: DepartmentKey; label: string }[] = [
  { key: "elementary", label: "유초등부" },
  { key: "middleHigh", label: "중고등부" },
  { key: "youngAdult", label: "청년부" },
  { key: "adult", label: "교구" },
];

export function MemberRosterTab({ roster, onChange }: Props) {
  const [activeDept, setActiveDept] = useState<DepartmentKey>("elementary");

  return (
    <div className="roster-tab">
      <div className="segmented-control roster-dept-tabs" aria-label="부서 선택">
        {DEPT_TABS.map(({ key, label }) => (
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
        <PhoneNumberManager roster={roster} onChange={onChange} />
      )}
    </div>
  );
}
