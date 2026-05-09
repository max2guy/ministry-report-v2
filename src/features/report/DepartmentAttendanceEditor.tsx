import type React from "react";
import { useId, useState } from "react";
import {
  addDepartmentMember,
  deleteDepartmentMember,
  hasMemberCards,
  hasZones,
  markAllAbsent,
  markAllPresent,
  moveToGroup,
  reorderDepartmentMembers,
  toggleDepartmentMember,
} from "../../domain/reportMembers";
import type { DepartmentKey, DepartmentMember, DepartmentReport } from "../../domain/reportTypes";
import { useCrossGroupDrag, type GroupId } from "./useCrossGroupDrag";
import { useSortCards } from "./useSortCards";
import { ZonedDepartmentAttendanceEditor } from "./ZonedDepartmentAttendanceEditor";

type DepartmentAttendanceEditorProps = {
  department: DepartmentReport;
  reportDate: string;
  onChange: (key: DepartmentKey, nextDepartment: DepartmentReport) => void;
};

/** 섹션 분리 설정 */
type SplitConfig = {
  groupAKey: string; groupALabel: string;
  groupBKey: string; groupBLabel: string;
};

const SPLIT_CONFIG: Partial<Record<DepartmentKey, SplitConfig>> = {
  elementary: { groupAKey: "kindergarten", groupALabel: "유치부", groupBKey: "elementary", groupBLabel: "초등부" },
  middleHigh:  { groupAKey: "middle",       groupALabel: "중등부",  groupBKey: "high",        groupBLabel: "고등부" },
  youngAdult:  { groupAKey: "college",      groupALabel: "대학부",  groupBKey: "worker",      groupBLabel: "직장부" },
};

/** 섹션 분리 부서 렌더러 */
function SplitDeptEditor({
  department,
  config,
  onChange,
}: {
  department: DepartmentReport;
  config: SplitConfig;
  onChange: (key: DepartmentKey, next: DepartmentReport) => void;
}) {
  const { groupAKey, groupALabel, groupBKey, groupBLabel } = config;
  const [draftName, setDraftName] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [addGroup, setAddGroup] = useState<GroupId>("");
  const [isEditing, setIsEditing] = useState(false);

  const crossDrag = useCrossGroupDrag((fromGroup, fromIdx, toGroup, toIdx) => {
    onChange(department.key, moveToGroup(department, groupAKey, groupBKey, fromGroup, fromIdx, toGroup, toIdx));
  });

  const allMembers = department.members ?? [];
  const resolveGroup = (m: DepartmentMember) => (!m.group || m.group === groupAKey) ? groupAKey : groupBKey;
  const membersA = allMembers.filter(m => resolveGroup(m) === groupAKey);
  const membersB = allMembers.filter(m => resolveGroup(m) === groupBKey);

  const total    = allMembers.length;
  const present  = department.attendance;
  const presentA = membersA.filter(m => m.status === "present").length;
  const presentB = membersB.filter(m => m.status === "present").length;

  function handleToggle(memberId: string) {
    if (isEditing) return;
    onChange(department.key, toggleDepartmentMember(department, memberId));
  }

  function handleDelete(memberId: string) {
    onChange(department.key, deleteDepartmentMember(department, memberId));
  }

  function handleAddMember(group: GroupId) {
    const next = addDepartmentMember(department, draftName, group);
    if (next === department) return;
    onChange(department.key, next);
    setDraftName(""); setShowAddRow(false);
  }

  function renderSection(
    label: string,
    groupKey: GroupId,
    members: DepartmentMember[],
    containerRef: React.RefObject<HTMLDivElement | null>,
    presentCount: number,
  ) {
    return (
      <div className="attendance-group-section">
        <div className="attendance-group-header">
          <span className="attendance-group-title">{label}</span>
          <span className="attendance-group-stat">{presentCount}/{members.length}</span>
          {!isEditing && (
            <button
              type="button"
              className="btn-action btn-add attendance-group-add-btn"
              onClick={() => {
                if (showAddRow && addGroup === groupKey) { setShowAddRow(false); setDraftName(""); }
                else { setShowAddRow(true); setAddGroup(groupKey); setDraftName(""); }
              }}
            >
              인원추가
            </button>
          )}
        </div>

        {showAddRow && addGroup === groupKey && !isEditing && (
          <div className="attendance-add-row">
            <input
              autoFocus
              aria-label={`${label} 인원 추가`}
              value={draftName}
              placeholder="이름 입력"
              onChange={e => setDraftName(e.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  { e.preventDefault(); handleAddMember(groupKey); }
                if (e.key === "Escape") { setShowAddRow(false); setDraftName(""); }
              }}
            />
            <button type="button" onClick={() => handleAddMember(groupKey)}>추가</button>
            <button type="button" className="btn-add-cancel" onClick={() => { setShowAddRow(false); setDraftName(""); }}>취소</button>
          </div>
        )}

        <div
          ref={containerRef}
          className={`attendance-card-list${crossDrag.isDraggingAny && !isEditing ? " is-sorting" : ""}${isEditing ? " is-edit-mode" : ""}`}
          {...(!isEditing ? crossDrag.sectionProps(groupKey, members.length) : {})}
        >
          {members.length === 0 && !isEditing && (
            <div className="attendance-drop-zone">여기로 드래그</div>
          )}
          {members.map((member, localIdx) => (
            <div
              key={member.id}
              className="attendance-card-wrap"
              // 래퍼에도 data 속성 부여 → 카드 사이 gap에서도 touch 감지
              {...(!isEditing ? { "data-drag-group": groupKey, "data-drag-idx": String(localIdx) } : {})}
            >
              <button
                type="button"
                aria-label={`${member.name} ${member.status === "present" ? "출석" : "결석"}`}
                className={[
                  "attendance-card",
                  member.status === "present" ? "is-present" : "is-absent",
                  !isEditing && crossDrag.isDragging(groupKey, localIdx) ? "is-dragging" : "",
                  !isEditing && crossDrag.isOver(groupKey, localIdx)     ? "is-drag-over" : "",
                  isEditing ? "is-edit-mode" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { if (!crossDrag.wasJustDragged.current) handleToggle(member.id); }}
                {...(!isEditing ? crossDrag.mouseProps(groupKey, localIdx) : {})}
                {...(!isEditing ? crossDrag.touchProps(groupKey, localIdx) : {})}
              >
                {member.name}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="card-delete-btn"
                  aria-label={`${member.name} 삭제`}
                  onClick={() => handleDelete(member.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-card-editor">
      <div className="attendance-card-actions">
        <button
          type="button"
          className={`btn-action ${isEditing ? "btn-edit-done" : "btn-edit"}`}
          onClick={() => { setIsEditing(v => !v); setShowAddRow(false); }}
        >
          {isEditing ? "완료" : "편집"}
        </button>
        {!isEditing && (
          <>
            <button type="button" className="btn-action btn-all-present"
              onClick={() => onChange(department.key, markAllPresent(department))}>전원출석</button>
            <button type="button" className="btn-action btn-all-absent"
              onClick={() => onChange(department.key, markAllAbsent(department))}>전원결석</button>
          </>
        )}
      </div>

      <div className="attendance-stats" aria-live="polite">
        <div className="attendance-stat"><strong>{present}</strong><span>출석</span></div>
        <div className="attendance-stat"><strong>{total - present}</strong><span>결석</span></div>
        <div className="attendance-stat"><strong>{total}</strong><span>전체</span></div>
      </div>

      {renderSection(groupALabel, groupAKey, membersA, crossDrag.middleContainerRef, presentA)}
      {renderSection(groupBLabel, groupBKey, membersB, crossDrag.highContainerRef,   presentB)}
    </div>
  );
}

export function DepartmentAttendanceEditor({
  department,
  reportDate,
  onChange,
}: DepartmentAttendanceEditorProps) {
  const [draftName, setDraftName] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputId = useId();

  const sort = useSortCards((from, to) => {
    onChange(department.key, reorderDepartmentMembers(department, from, to));
  });

  if (hasZones(department)) {
    return <ZonedDepartmentAttendanceEditor department={department} reportDate={reportDate} onChange={onChange} />;
  }

  if (!hasMemberCards(department)) return null;

  // 섹션 분리 부서 처리
  const splitConfig = SPLIT_CONFIG[department.key];
  if (splitConfig) {
    return <SplitDeptEditor department={department} config={splitConfig} onChange={onChange} />;
  }

  // 일반 부서
  const total   = department.members?.length ?? 0;
  const present = department.attendance;
  const absent  = total - present;

  function handleToggle(memberId: string) {
    if (isEditing) return;
    onChange(department.key, toggleDepartmentMember(department, memberId));
  }

  function handleDelete(memberId: string) {
    onChange(department.key, deleteDepartmentMember(department, memberId));
  }

  function handleAddMember() {
    const next = addDepartmentMember(department, draftName);
    if (next === department) return;
    onChange(department.key, next);
    setDraftName(""); setShowAddRow(false);
  }

  return (
    <div className="attendance-card-editor">
      <div className="attendance-card-actions">
        <button
          type="button"
          className={`btn-action ${isEditing ? "btn-edit-done" : "btn-edit"}`}
          onClick={() => { setIsEditing(v => !v); setShowAddRow(false); }}
        >
          {isEditing ? "완료" : "편집"}
        </button>
        {!isEditing && (
          <>
            <button type="button" className="btn-action btn-add"
              onClick={() => setShowAddRow(v => !v)}>인원추가</button>
            <button type="button" className="btn-action btn-all-present"
              onClick={() => onChange(department.key, markAllPresent(department))}>전원출석</button>
            <button type="button" className="btn-action btn-all-absent"
              onClick={() => onChange(department.key, markAllAbsent(department))}>전원결석</button>
          </>
        )}
      </div>

      <div className="attendance-stats" aria-live="polite">
        <div className="attendance-stat"><strong>{present}</strong><span>출석</span></div>
        <div className="attendance-stat"><strong>{absent}</strong><span>결석</span></div>
        <div className="attendance-stat"><strong>{total}</strong><span>전체</span></div>
      </div>

      {showAddRow && !isEditing && (
        <div className="attendance-add-row">
          <input
            id={inputId}
            aria-label="인원 추가"
            value={draftName}
            placeholder="이름 입력"
            autoFocus
            onChange={e => setDraftName(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === "Enter")  { e.preventDefault(); handleAddMember(); }
              if (e.key === "Escape") { setShowAddRow(false); setDraftName(""); }
            }}
          />
          <button type="button" onClick={handleAddMember}>추가</button>
          <button type="button" className="btn-add-cancel" onClick={() => { setShowAddRow(false); setDraftName(""); }}>취소</button>
        </div>
      )}

      <div
        ref={sort.containerRef}
        className={`attendance-card-list${sort.isDragging ? " is-sorting" : ""}${isEditing ? " is-edit-mode" : ""}`}
        aria-label={`${department.name} 출결 카드`}
      >
        {department.members?.map((member, i) => (
          <div
            key={member.id}
            className="attendance-card-wrap"
            {...(!isEditing ? { "data-drag-idx": String(i) } : {})}
          >
            <button
              type="button"
              aria-label={`${member.name} ${member.status === "present" ? "출석" : "결석"}`}
              className={[
                "attendance-card",
                member.status === "present" ? "is-present" : "is-absent",
                !isEditing && sort.dragIdx === i ? "is-dragging" : "",
                !isEditing && sort.overIdx === i ? "is-drag-over" : "",
                isEditing ? "is-edit-mode" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => { if (!sort.wasJustDragged.current) handleToggle(member.id); }}
              {...(!isEditing ? sort.mouseProps(i) : {})}
              {...(!isEditing ? sort.touchProps(i) : {})}
            >
              {member.name}
            </button>
            {isEditing && (
              <button
                type="button"
                className="card-delete-btn"
                aria-label={`${member.name} 삭제`}
                onClick={() => handleDelete(member.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
