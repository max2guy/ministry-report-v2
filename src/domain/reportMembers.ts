import type {
  DepartmentMember,
  DepartmentMemberStatus,
  DepartmentReport,
  DepartmentZone,
} from "./reportTypes";

function cloneMembers(members: DepartmentMember[]): DepartmentMember[] {
  return members.map((member) => ({ ...member }));
}

function cloneZones(zones: DepartmentZone[]): DepartmentZone[] {
  return zones.map((z) => ({ ...z, members: cloneMembers(z.members) }));
}

export function hasZones(department: DepartmentReport): boolean {
  return Array.isArray(department.zones);
}

export function deriveZoneAttendance(zones: DepartmentZone[]): number {
  return zones.reduce(
    (sum, z) => sum + z.members.filter((m) => m.status === "present").length,
    0,
  );
}

export function toggleZoneMember(
  department: DepartmentReport,
  zoneId: string,
  memberId: string,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) =>
    z.id !== zoneId
      ? z
      : {
          ...z,
          members: z.members.map((m) =>
            m.id !== memberId
              ? m
              : { ...m, status: (m.status === "present" ? "absent" : "present") as DepartmentMemberStatus },
          ),
        },
  );
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function markZoneAllPresent(
  department: DepartmentReport,
  zoneId: string,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) =>
    z.id !== zoneId ? z : { ...z, members: z.members.map((m) => ({ ...m, status: "present" as const })) },
  );
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function markZoneAllAbsent(
  department: DepartmentReport,
  zoneId: string,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) =>
    z.id !== zoneId ? z : { ...z, members: z.members.map((m) => ({ ...m, status: "absent" as const })) },
  );
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function markAllZonesPresent(department: DepartmentReport): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) => ({
    ...z,
    members: z.members.map((m) => ({ ...m, status: "present" as const })),
  }));
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function markAllZonesAbsent(department: DepartmentReport): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) => ({
    ...z,
    members: z.members.map((m) => ({ ...m, status: "absent" as const })),
  }));
  return { ...department, zones, attendance: 0 };
}

export function hasMemberCards(department: DepartmentReport): boolean {
  return Array.isArray(department.members);
}

export function deriveAttendanceFromMembers(department: DepartmentReport): number {
  if (!department.members) {
    return department.attendance;
  }

  return department.members.filter((member) => member.status === "present").length;
}

export function toggleDepartmentMember(
  department: DepartmentReport,
  memberId: string,
): DepartmentReport {
  if (!department.members) {
    return department;
  }

  const members = cloneMembers(department.members).map((member) =>
    member.id === memberId
      ? (() => {
          const status: DepartmentMemberStatus =
            member.status === "present" ? "absent" : "present";

          return {
            ...member,
            status,
          };
        })()
      : member,
  );

  return {
    ...department,
    members,
    attendance: deriveAttendanceFromMembers({ ...department, members }),
  };
}

export function markAllPresent(department: DepartmentReport): DepartmentReport {
  if (!department.members) return department;
  const members = cloneMembers(department.members).map((m) => ({ ...m, status: "present" as const }));
  return { ...department, members, attendance: members.length };
}

export function markAllAbsent(department: DepartmentReport): DepartmentReport {
  if (!department.members) return department;
  const members = cloneMembers(department.members).map((m) => ({ ...m, status: "absent" as const }));
  return { ...department, members, attendance: 0 };
}

export function reorderDepartmentMembers(
  department: DepartmentReport,
  fromIdx: number,
  toIdx: number,
): DepartmentReport {
  if (!department.members) return department;
  const members = cloneMembers(department.members);
  const [removed] = members.splice(fromIdx, 1);
  members.splice(toIdx, 0, removed);
  return { ...department, members };
}

export function reorderZoneMembers(
  department: DepartmentReport,
  zoneId: string,
  fromIdx: number,
  toIdx: number,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) => {
    if (z.id !== zoneId) return z;
    const members = [...z.members];
    const [removed] = members.splice(fromIdx, 1);
    members.splice(toIdx, 0, removed);
    return { ...z, members };
  });
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function addZoneMember(
  department: DepartmentReport,
  zoneId: string,
  name: string,
): DepartmentReport {
  const trimmed = name.trim();
  if (!trimmed || !department.zones) return department;
  const zones = cloneZones(department.zones).map((z) =>
    z.id !== zoneId
      ? z
      : { ...z, members: [...z.members, { id: crypto.randomUUID(), name: trimmed, status: "absent" as const }] },
  );
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function deleteZoneMember(
  department: DepartmentReport,
  zoneId: string,
  memberId: string,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones).map((z) =>
    z.id !== zoneId ? z : { ...z, members: z.members.filter((m) => m.id !== memberId) },
  );
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

/** 이동 버튼: memberId 기준으로 구역 간 이동 */
export function moveZoneMemberToZone(
  department: DepartmentReport,
  fromZoneId: string,
  memberId: string,
  targetZoneId: string,
): DepartmentReport {
  if (!department.zones || fromZoneId === targetZoneId) return department;
  const zones = cloneZones(department.zones);
  const fromZone = zones.find((z) => z.id === fromZoneId);
  const toZone   = zones.find((z) => z.id === targetZoneId);
  if (!fromZone || !toZone) return department;
  const idx = fromZone.members.findIndex((m) => m.id === memberId);
  if (idx === -1) return department;
  const [moved] = fromZone.members.splice(idx, 1);
  toZone.members.push(moved);
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

/** 구역 간(또는 구역 내) 멤버 이동 */
export function moveZoneMember(
  department: DepartmentReport,
  fromZoneId: string, fromLocalIdx: number,
  toZoneId: string,   toLocalIdx: number,
): DepartmentReport {
  if (!department.zones) return department;
  const zones = cloneZones(department.zones);
  const fromZone = zones.find((z) => z.id === fromZoneId);
  const toZone   = zones.find((z) => z.id === toZoneId);
  if (!fromZone || !toZone) return department;

  if (fromZoneId === toZoneId) {
    const members = fromZone.members;
    const [moved] = members.splice(fromLocalIdx, 1);
    members.splice(toLocalIdx, 0, moved);
  } else {
    const [moved] = fromZone.members.splice(fromLocalIdx, 1);
    toZone.members.splice(toLocalIdx, 0, moved);
  }
  return { ...department, zones, attendance: deriveZoneAttendance(zones) };
}

export function addDepartmentMember(
  department: DepartmentReport,
  name: string,
  group?: string,
): DepartmentReport {
  if (!department.members) {
    return department;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return department;
  }

  const newMember: { id: string; name: string; status: "absent"; group?: string } = {
    id: crypto.randomUUID(),
    name: trimmedName,
    status: "absent" as const,
  };
  if (group !== undefined) newMember.group = group;

  const members = [
    ...cloneMembers(department.members),
    newMember,
  ];

  return {
    ...department,
    members,
    attendance: deriveAttendanceFromMembers({ ...department, members }),
  };
}

/**
 * 섹션 분리 부서(유초등부·중고등부) 카드 이동 — 섹션 내 순서 변경 및 섹션 간 이동 모두 처리.
 * groupAKey: 첫 번째 섹션 key (group === undefined 인 멤버도 이 그룹으로 간주)
 * groupBKey: 두 번째 섹션 key
 */
export function moveToGroup(
  department: DepartmentReport,
  groupAKey: string,
  groupBKey: string,
  fromGroup: string,
  fromLocalIdx: number,
  toGroup: string,
  toLocalIdx: number,
): DepartmentReport {
  if (!department.members) return department;

  const resolveGroup = (m: DepartmentMember) =>
    (!m.group || m.group === groupAKey) ? groupAKey : groupBKey;

  const groupA = department.members.filter(m => resolveGroup(m) === groupAKey);
  const groupB = department.members.filter(m => resolveGroup(m) === groupBKey);

  const srcArr = fromGroup === groupAKey ? groupA : groupB;
  const srcMember = srcArr[fromLocalIdx];
  if (!srcMember) return department;

  const newA = [...groupA];
  const newB = [...groupB];
  if (fromGroup === groupAKey) newA.splice(fromLocalIdx, 1);
  else                         newB.splice(fromLocalIdx, 1);

  const moved = { ...srcMember, group: toGroup };
  if (toGroup === groupAKey) {
    newA.splice(Math.min(toLocalIdx, newA.length), 0, moved);
  } else {
    newB.splice(Math.min(toLocalIdx, newB.length), 0, moved);
  }

  const newMembers = [...newA, ...newB];
  return {
    ...department,
    members: newMembers,
    attendance: deriveAttendanceFromMembers({ ...department, members: newMembers }),
  };
}

/** 부서 멤버 삭제 (출석탭에서 사용) */
export function deleteDepartmentMember(
  department: DepartmentReport,
  memberId: string,
): DepartmentReport {
  if (!department.members) return department;
  const members = department.members.filter(m => m.id !== memberId);
  return {
    ...department,
    members,
    attendance: deriveAttendanceFromMembers({ ...department, members }),
  };
}
