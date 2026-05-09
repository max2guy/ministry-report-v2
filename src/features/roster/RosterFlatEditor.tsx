import { useState } from "react";
import type { MemberRoster, RosterMember } from "../../domain/memberRoster";
import type { DepartmentKey } from "../../domain/reportTypes";

type Props = {
  deptKey: Exclude<DepartmentKey, "adult">;
  roster: MemberRoster;
  onChange: (roster: MemberRoster) => void;
};

/** 섹션 분리 설정 (유초등부·중고등부) */
type SplitConfig = {
  groupAKey: string; groupALabel: string;
  groupBKey: string; groupBLabel: string;
};

const SPLIT_CONFIG: Partial<Record<DepartmentKey, SplitConfig>> = {
  elementary: {
    groupAKey: "kindergarten", groupALabel: "유치부",
    groupBKey: "elementary",   groupBLabel: "초등부",
  },
  middleHigh: {
    groupAKey: "middle", groupALabel: "중등부",
    groupBKey: "high",   groupBLabel: "고등부",
  },
  youngAdult: {
    groupAKey: "college", groupALabel: "대학부",
    groupBKey: "worker",  groupBLabel: "직장부",
  },
};

export function RosterFlatEditor({ deptKey, roster, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");

  const dept = roster.departments[deptKey];
  const members: RosterMember[] = dept.kind === "flat" ? dept.members : [];

  function updateMembers(next: RosterMember[]) {
    onChange({
      ...roster,
      departments: { ...roster.departments, [deptKey]: { kind: "flat", members: next } },
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDelete(id: string) {
    updateMembers(members.filter(m => m.id !== id));
  }

  function handleAdd(name: string, group?: string, clearDraft?: () => void) {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMembers([...members, { id: crypto.randomUUID(), name: trimmed, ...(group ? { group } : {}) }]);
    clearDraft?.();
  }

  const splitConfig = SPLIT_CONFIG[deptKey];

  // ── 섹션 분리 부서 ──────────────────────────────────────────
  if (splitConfig) {
    const { groupAKey, groupALabel, groupBKey, groupBLabel } = splitConfig;
    const resolveGroup = (m: RosterMember) =>
      (!m.group || m.group === groupAKey) ? groupAKey : groupBKey;
    const membersA = members.filter(m => resolveGroup(m) === groupAKey);
    const membersB = members.filter(m => resolveGroup(m) === groupBKey);

    const renderSection = (
      label: string,
      groupKey: string,
      sectionMembers: RosterMember[],
      draftVal: string,
      setDraftVal: (v: string) => void,
    ) => (
      <div className="roster-group-section">
        <h4 className="roster-group-title">
          {label} <span className="roster-group-count">({sectionMembers.length}명)</span>
        </h4>
        <ul className="roster-member-list">
          {sectionMembers.map(m => (
            <li key={m.id} className="roster-member-item">
              <span>{m.name}</span>
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
            aria-label={`${label} 이름 입력`}
            value={draftVal}
            placeholder="이름 입력"
            onChange={e => setDraftVal(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd(draftVal, groupKey, () => setDraftVal(""));
              }
            }}
          />
          <button type="button" onClick={() => handleAdd(draftVal, groupKey, () => setDraftVal(""))}>
            추가
          </button>
        </div>
      </div>
    );

    return (
      <div className="roster-flat-editor">
        {renderSection(groupALabel, groupAKey, membersA, draftA, setDraftA)}
        {renderSection(groupBLabel, groupBKey, membersB, draftB, setDraftB)}
      </div>
    );
  }

  // ── 일반 부서 ───────────────────────────────────────────────
  return (
    <div className="roster-flat-editor">
      <ul className="roster-member-list">
        {members.map(m => (
          <li key={m.id} className="roster-member-item">
            <span>{m.name}</span>
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
          aria-label="이름 입력"
          value={draft}
          placeholder="이름 입력"
          onChange={e => setDraft(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(draft, undefined, () => setDraft("")); }
          }}
        />
        <button type="button" onClick={() => handleAdd(draft, undefined, () => setDraft(""))}>추가</button>
      </div>
    </div>
  );
}
