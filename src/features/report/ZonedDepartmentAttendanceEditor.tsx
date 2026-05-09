import { useRef, useState } from "react";
import {
  addZoneMember,
  deleteZoneMember,
  deriveZoneAttendance,
  hasZones,
  markAllZonesAbsent,
  markAllZonesPresent,
  markZoneAllAbsent,
  markZoneAllPresent,
  moveZoneMember,
  toggleZoneMember,
} from "../../domain/reportMembers";
import type { DepartmentKey, DepartmentReport, DepartmentZone } from "../../domain/reportTypes";
import { useCrossGroupDrag, type GroupId } from "./useCrossGroupDrag";
import { SmsPanel } from "./SmsPanel";
import { isMobile } from "./smsUtils";

type Props = {
  department: DepartmentReport;
  reportDate: string;
  onChange: (key: DepartmentKey, next: DepartmentReport) => void;
};

function roleLabel(role?: string) {
  if (role === "leader") return "장";
  if (role === "inspector") return "권";
  return null;
}

/** 구역 카드 그룹 */
function ZoneGroup({
  zone,
  isEditing,
  isDraggingAny,
  onToggle,
  onAllPresent,
  onAllAbsent,
  onAdd,
  onDelete,
  isDragging,
  isOver,
  mouseProps,
  touchProps,
  sectionProps,
}: {
  zone: DepartmentZone;
  isEditing: boolean;
  isDraggingAny: boolean;
  onToggle: (memberId: string) => void;
  onAllPresent: () => void;
  onAllAbsent: () => void;
  onAdd: (name: string) => void;
  onDelete: (memberId: string) => void;
  isDragging: (group: GroupId, idx: number) => boolean;
  isOver: (group: GroupId, idx: number) => boolean;
  mouseProps: (group: GroupId, idx: number) => Record<string, unknown>;
  touchProps: (group: GroupId, idx: number) => Record<string, unknown>;
  sectionProps: (group: GroupId, count: number) => Record<string, unknown>;
}) {
  const [draft, setDraft] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const present = zone.members.filter((m) => m.status === "present").length;
  const total = zone.members.length;

  function handleAdd() {
    onAdd(draft);
    setDraft("");
    setShowAddRow(false);
  }

  return (
    <div className="zone-group">
      <div className="zone-header">
        <span className="zone-name">{zone.name}</span>
        <span className="zone-badge">{present}/{total}</span>
        {!isEditing && (
          <>
            <button
              type="button"
              className="zone-btn zone-btn-add"
              onClick={() => { setShowAddRow(v => !v); setDraft(""); }}
            >
              인원추가
            </button>
            <button type="button" className="zone-btn zone-btn-present" onClick={onAllPresent}>
              전원출석
            </button>
            <button type="button" className="zone-btn zone-btn-absent" onClick={onAllAbsent}>
              전원결석
            </button>
          </>
        )}
      </div>

      {showAddRow && !isEditing && (
        <div className="attendance-add-row">
          <input
            autoFocus
            aria-label={`${zone.name} 인원 추가`}
            value={draft}
            placeholder="이름 입력"
            onChange={e => setDraft(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") { setShowAddRow(false); setDraft(""); }
            }}
          />
          <button type="button" onClick={handleAdd}>추가</button>
          <button type="button" className="btn-add-cancel" onClick={() => { setShowAddRow(false); setDraft(""); }}>취소</button>
        </div>
      )}

      <div
        className={[
          "attendance-card-list",
          isDraggingAny && !isEditing ? "is-sorting" : "",
          isEditing ? "is-edit-mode" : "",
        ].filter(Boolean).join(" ")}
        role="list"
        aria-label={`${zone.name} 출결`}
        {...(!isEditing ? sectionProps(zone.id, zone.members.length) : {})}
      >
        {zone.members.length === 0 && !isEditing && (
          <div className="attendance-drop-zone">여기로 드래그</div>
        )}
        {zone.members.map((member, i) => {
          const badge = roleLabel(member.role);
          return (
            <div
              key={member.id}
              className="attendance-card-wrap"
              {...(!isEditing ? { "data-drag-group": zone.id, "data-drag-idx": String(i) } : {})}
            >
              <button
                type="button"
                role="listitem"
                aria-label={`${member.name} ${member.status === "present" ? "출석" : "결석"}`}
                className={[
                  "attendance-card",
                  member.status === "present" ? "is-present" : "is-absent",
                  !isEditing && isDragging(zone.id, i) ? "is-dragging" : "",
                  !isEditing && isOver(zone.id, i)     ? "is-drag-over" : "",
                  isEditing ? "is-edit-mode" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { if (!isEditing) onToggle(member.id); }}
                {...(!isEditing ? mouseProps(zone.id, i) : {})}
                {...(!isEditing ? touchProps(zone.id, i) : {})}
              >
                {member.name}
                {badge && <span className="role-badge">{badge}</span>}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="card-delete-btn"
                  aria-label={`${member.name} 삭제`}
                  onClick={() => onDelete(member.id)}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistrictSection({
  district,
  zones,
  departmentKey,
  department,
  isEditing,
  isDraggingAny,
  onChange,
  isDragging,
  isOver,
  mouseProps,
  touchProps,
  sectionProps,
}: {
  district: number;
  zones: DepartmentZone[];
  departmentKey: DepartmentKey;
  department: DepartmentReport;
  isEditing: boolean;
  isDraggingAny: boolean;
  onChange: (key: DepartmentKey, next: DepartmentReport) => void;
  isDragging: (group: GroupId, idx: number) => boolean;
  isOver: (group: GroupId, idx: number) => boolean;
  mouseProps: (group: GroupId, idx: number) => Record<string, unknown>;
  touchProps: (group: GroupId, idx: number) => Record<string, unknown>;
  sectionProps: (group: GroupId, count: number) => Record<string, unknown>;
}) {
  const present = zones.reduce((s, z) => s + z.members.filter((m) => m.status === "present").length, 0);
  const total   = zones.reduce((s, z) => s + z.members.length, 0);

  return (
    <div className="district-section">
      <div className="district-header">
        <span className="district-name">{district}교구</span>
        <span className="zone-badge">{present}/{total}</span>
      </div>
      {zones.map((zone) => (
        <ZoneGroup
          key={zone.id}
          zone={zone}
          isEditing={isEditing}
          isDraggingAny={isDraggingAny}
          onToggle={(memberId) =>
            onChange(departmentKey, toggleZoneMember(department, zone.id, memberId))
          }
          onAllPresent={() => onChange(departmentKey, markZoneAllPresent(department, zone.id))}
          onAllAbsent={() => onChange(departmentKey, markZoneAllAbsent(department, zone.id))}
          onAdd={(name) => onChange(departmentKey, addZoneMember(department, zone.id, name))}
          onDelete={(memberId) => onChange(departmentKey, deleteZoneMember(department, zone.id, memberId))}
          isDragging={isDragging}
          isOver={isOver}
          mouseProps={mouseProps}
          touchProps={touchProps}
          sectionProps={sectionProps}
        />
      ))}
    </div>
  );
}

export function ZonedDepartmentAttendanceEditor({ department, reportDate, onChange }: Props) {
  const [showSms, setShowSms] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const allZonesRef = useRef<HTMLDivElement | null>(null);

  const crossDrag = useCrossGroupDrag(
    (fromGroup, fromIdx, toGroup, toIdx) => {
      onChange(department.key, moveZoneMember(department, fromGroup, fromIdx, toGroup, toIdx));
    },
    {
      onSetTouchAction: (value) => {
        if (allZonesRef.current) allZonesRef.current.style.touchAction = value;
      },
    },
  );

  if (!hasZones(department) || !department.zones) return null;

  const zones = department.zones;
  const totalPresent = deriveZoneAttendance(zones);
  const totalAll = zones.reduce((s, z) => s + z.members.length, 0);
  const totalAbsent = totalAll - totalPresent;
  const districts = [...new Set(zones.map((z) => z.district))].sort();

  return (
    <div className="attendance-card-editor">
      <div className="attendance-card-actions">
        <button
          type="button"
          className={`btn-action ${isEditing ? "btn-edit-done" : "btn-edit"}`}
          onClick={() => { setIsEditing(v => !v); }}
        >
          {isEditing ? "완료" : "편집"}
        </button>
        {!isEditing && (
          <>
            <button
              type="button"
              className="btn-action btn-all-present"
              onClick={() => onChange(department.key, markAllZonesPresent(department))}
            >
              전원출석
            </button>
            <button
              type="button"
              className="btn-action btn-all-absent"
              onClick={() => onChange(department.key, markAllZonesAbsent(department))}
            >
              전원결석
            </button>
          </>
        )}
      </div>

      <div className="attendance-stats" aria-live="polite">
        <div className="attendance-stat"><strong>{totalPresent}</strong><span>출석</span></div>
        <div className="attendance-stat"><strong>{totalAbsent}</strong><span>결석</span></div>
        <div className="attendance-stat"><strong>{totalAll}</strong><span>전체</span></div>
      </div>

      <div ref={allZonesRef}>
        {districts.map((district) => (
          <DistrictSection
            key={district}
            district={district}
            zones={zones.filter((z) => z.district === district)}
            departmentKey={department.key}
            department={department}
            isEditing={isEditing}
            isDraggingAny={crossDrag.isDraggingAny}
            onChange={onChange}
            isDragging={crossDrag.isDragging}
            isOver={crossDrag.isOver}
            mouseProps={crossDrag.mouseProps as (group: GroupId, idx: number) => Record<string, unknown>}
            touchProps={crossDrag.touchProps as (group: GroupId, idx: number) => Record<string, unknown>}
            sectionProps={crossDrag.sectionProps as (group: GroupId, count: number) => Record<string, unknown>}
          />
        ))}
      </div>

      <div className="sms-button-row">
        <button
          type="button"
          className="btn-sms-trigger"
          onClick={() => {
            if (!isMobile()) {
              alert("이 기능은 모바일에서만 사용할 수 있습니다.");
              return;
            }
            setShowSms(true);
          }}
        >
          📱 문자 발송
        </button>
      </div>

      {showSms && (
        <SmsPanel
          zones={zones}
          reportDate={reportDate}
          onClose={() => setShowSms(false)}
        />
      )}
    </div>
  );
}
