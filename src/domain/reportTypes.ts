import type { MemberRoster } from "./memberRoster";

export type ReportSchemaVersion = 2;

export type DepartmentKey = "elementary" | "middleHigh" | "youngAdult" | "adult";

export type DepartmentMemberStatus = "present" | "absent";

export type DepartmentMemberRole = "leader" | "inspector" | "member";

export type DepartmentMember = {
  id: string;
  name: string;
  status: DepartmentMemberStatus;
  role?: DepartmentMemberRole;
  phone?: string;
  group?: string; // 섹션 구분 (중고등부: "middle"/"high", 유초등부: "kindergarten"/"elementary")
};

export type DepartmentZone = {
  id: string;
  name: string;
  district: number;
  members: DepartmentMember[];
};

export type DepartmentReport = {
  key: DepartmentKey;
  name: string;
  attendance: number;
  newVisitors: number;
  summary: string;
  members?: DepartmentMember[];
  zones?: DepartmentZone[];
};

export type MinistryReport = {
  schemaVersion: ReportSchemaVersion;
  id: string;
  title: string;
  reportDate: string;
  churchName: string;
  pastorName: string;
  departments: Record<DepartmentKey, DepartmentReport>;
  offerings: {
    total: number;
    memo: string;
  };
  prayerRequests: string[];
  announcements: string[];
  createdAt: string;
  updatedAt: string;
};

export function createDepartmentMembers(names: string[]): DepartmentMember[] {
  return names.map((name) => ({
    id: crypto.randomUUID(),
    name,
    status: "present",
  }));
}

function createZone(
  name: string,
  district: number,
  defs: Array<{ name: string; role: DepartmentMemberRole }>,
): DepartmentZone {
  return {
    id: crypto.randomUUID(),
    name,
    district,
    members: defs.map(({ name: n, role }) => ({
      id: crypto.randomUUID(),
      name: n,
      role,
      status: "present",
    })),
  };
}

function createAdultZones(): DepartmentZone[] {
  return [
    createZone("1구역", 1, [
      { name: "이명숙", role: "leader" }, { name: "안성문", role: "member" },
      { name: "김영순", role: "inspector" }, { name: "김명호", role: "member" },
      { name: "이종순", role: "member" }, { name: "지정웅", role: "member" },
      { name: "임한나", role: "member" }, { name: "정나단", role: "member" },
      { name: "조병옥", role: "member" }, { name: "조병임", role: "member" },
      { name: "이덕재", role: "member" }, { name: "최순복", role: "member" },
      { name: "양창운", role: "member" }, { name: "최정분", role: "member" },
      { name: "황재희", role: "member" }, { name: "전정예", role: "member" },
    ]),
    createZone("2구역", 1, [
      { name: "민옥화", role: "leader" }, { name: "박진숙", role: "inspector" },
      { name: "김두곤", role: "member" }, { name: "송을범", role: "member" },
      { name: "심순덕", role: "member" }, { name: "염재훈", role: "member" },
      { name: "이승숙", role: "member" }, { name: "이윤형", role: "member" },
      { name: "당윤수", role: "member" }, { name: "이지현", role: "member" },
      { name: "정현철", role: "member" }, { name: "임금란", role: "member" },
      { name: "임희순", role: "member" }, { name: "김석규", role: "member" },
      { name: "조남주", role: "member" },
    ]),
    createZone("3구역", 1, [
      { name: "임미자", role: "leader" }, { name: "우정식", role: "member" },
      { name: "김성숙", role: "inspector" }, { name: "박영준", role: "member" },
      { name: "권옥자", role: "member" }, { name: "류홍렬", role: "member" },
      { name: "박순옥", role: "member" }, { name: "서유정", role: "member" },
      { name: "황흥도", role: "member" }, { name: "이이순", role: "member" },
      { name: "김수근", role: "member" }, { name: "최순옥", role: "member" },
      { name: "최현숙", role: "member" },
    ]),
    createZone("4구역", 1, [
      { name: "임혜진", role: "leader" }, { name: "임법상", role: "member" },
      { name: "조성주", role: "inspector" }, { name: "김수년", role: "member" },
      { name: "김명옥", role: "member" }, { name: "김애경", role: "member" },
      { name: "손정숙", role: "member" }, { name: "김경석", role: "member" },
      { name: "유제경", role: "member" }, { name: "엄동규", role: "member" },
      { name: "이도화", role: "member" }, { name: "최인숙", role: "member" },
      { name: "이진우", role: "member" }, { name: "황영숙", role: "member" },
      { name: "김주훈", role: "member" },
    ]),
    createZone("5구역", 1, [
      { name: "오민자", role: "leader" }, { name: "이상석", role: "member" },
      { name: "이미자", role: "inspector" }, { name: "한준식", role: "member" },
      { name: "고분선", role: "member" }, { name: "김교순", role: "member" },
      { name: "김혜진", role: "member" }, { name: "노필언", role: "member" },
      { name: "박승애", role: "member" }, { name: "박화자", role: "member" },
      { name: "유분의", role: "member" }, { name: "이성희", role: "member" },
      { name: "이승현", role: "member" }, { name: "이희열", role: "member" },
      { name: "임정숙", role: "member" }, { name: "장국지", role: "member" },
      { name: "최종분", role: "member" },
    ]),
    createZone("6구역", 1, [
      { name: "김순이", role: "leader" }, { name: "김미경", role: "inspector" },
      { name: "김덕희", role: "member" }, { name: "김은주", role: "member" },
      { name: "신영락", role: "member" }, { name: "노학심", role: "member" },
      { name: "박순영", role: "member" }, { name: "변기성", role: "member" },
      { name: "윤숙경", role: "member" }, { name: "이순희", role: "member" },
      { name: "박종학", role: "member" }, { name: "이춘생", role: "member" },
      { name: "최봉석", role: "member" }, { name: "최태인", role: "member" },
    ]),
    createZone("7구역", 2, [
      { name: "이정순", role: "leader" }, { name: "현명숙", role: "inspector" },
      { name: "이규훈", role: "member" }, { name: "권성배", role: "member" },
      { name: "김연자", role: "member" }, { name: "김희수", role: "member" },
      { name: "송경섭", role: "member" }, { name: "송현숙", role: "member" },
      { name: "김동호", role: "member" }, { name: "유순하", role: "member" },
      { name: "박광천", role: "member" }, { name: "이재선", role: "member" },
      { name: "조자형", role: "member" }, { name: "양태모", role: "member" },
      { name: "한선분", role: "member" },
    ]),
    createZone("8구역", 2, [
      { name: "김영숙", role: "leader" }, { name: "유미선", role: "inspector" },
      { name: "나인용", role: "member" }, { name: "권금애", role: "member" },
      { name: "김미순", role: "member" }, { name: "김병기", role: "member" },
      { name: "김은정", role: "member" }, { name: "김규보", role: "member" },
      { name: "심기동", role: "member" }, { name: "원흥순", role: "member" },
      { name: "이현상", role: "member" }, { name: "윤석현", role: "member" },
      { name: "최필남", role: "member" }, { name: "정현숙", role: "member" },
      { name: "심완섭", role: "member" }, { name: "최기환", role: "member" },
    ]),
    createZone("9구역", 2, [
      { name: "양경순", role: "leader" }, { name: "전미영", role: "inspector" },
      { name: "이봉열", role: "member" }, { name: "강상희", role: "member" },
      { name: "고환필", role: "member" }, { name: "김미용", role: "member" },
      { name: "모동수", role: "member" }, { name: "박순복", role: "member" },
      { name: "박영철", role: "member" }, { name: "윤여임", role: "member" },
      { name: "이영주", role: "member" }, { name: "김효철", role: "member" },
      { name: "한정애", role: "member" },
    ]),
    createZone("10구역", 2, [
      { name: "조옥희", role: "leader" }, { name: "박양권", role: "member" },
      { name: "성복임", role: "inspector" }, { name: "박덕순", role: "member" },
      { name: "윤정희", role: "member" }, { name: "신임재", role: "member" },
      { name: "김건중", role: "member" }, { name: "이명희", role: "member" },
      { name: "정대호", role: "member" }, { name: "지정옥", role: "member" },
      { name: "고경설", role: "member" }, { name: "이옥현", role: "member" },
      { name: "지행자", role: "member" }, { name: "곽명희", role: "member" },
    ]),
    createZone("11구역", 2, [
      { name: "최숙녀", role: "leader" }, { name: "한명식", role: "member" },
      { name: "최옥연", role: "inspector" }, { name: "박종금", role: "member" },
      { name: "송종란", role: "member" }, { name: "전준석", role: "member" },
      { name: "이옥순", role: "member" }, { name: "김명량", role: "member" },
      { name: "이한나", role: "member" }, { name: "김광진", role: "member" },
      { name: "장월기", role: "member" }, { name: "정국자", role: "member" },
      { name: "최기복", role: "member" }, { name: "한승훈", role: "member" },
    ]),
    createZone("12구역", 2, [
      { name: "유은희", role: "leader" }, { name: "안준용", role: "member" },
      { name: "조명숙", role: "inspector" }, { name: "이순용", role: "member" },
      { name: "강지아", role: "member" }, { name: "나요나", role: "member" },
      { name: "전진구", role: "member" }, { name: "박진아", role: "member" },
      { name: "정민시", role: "member" }, { name: "이사라", role: "member" },
      { name: "천성현", role: "member" }, { name: "최주희", role: "member" },
      { name: "정수미", role: "member" }, { name: "민건우", role: "member" },
      { name: "한상미", role: "member" }, { name: "윤승희", role: "member" },
    ]),
  ];
}

function deriveAdultAttendance(zones: DepartmentZone[]): number {
  return zones.reduce(
    (sum, zone) => sum + zone.members.filter((m) => m.status === "present").length,
    0,
  );
}

function shouldUpgradeDepartmentToCards(department: DepartmentReport): boolean {
  return (
    department.members === undefined &&
    department.zones === undefined &&
    department.attendance === 0 &&
    department.newVisitors === 0 &&
    !department.summary.trim()
  );
}

function upgradeDepartmentToCards(department: DepartmentReport): DepartmentReport {
  if (!shouldUpgradeDepartmentToCards(department)) return department;

  if (department.key === "elementary") {
    return { ...department, members: createDepartmentMembers(["권상우", "천주아"]) };
  }
  if (department.key === "middleHigh") {
    return {
      ...department,
      members: createDepartmentMembers([
        "김규인", "김주영", "김주혁", "이예진", "이태양",
        "이호석", "정서원", "정시원", "정소원",
        "김주찬", "변아영", "변현섭", "최우진",
      ]),
    };
  }
  if (department.key === "youngAdult") {
    return {
      ...department,
      members: createDepartmentMembers([
        "고현아", "김보은", "김정인", "김주은", "김태양",
        "라규미", "박시은", "신승환", "안수용", "유다희",
        "유세희", "이석준", "정은정", "정혜정", "차예담",
        "한상희", "한혜원", "황원영",
      ]),
    };
  }
  if (department.key === "adult") {
    return department;
  }

  return { ...department, members: [] };
}

export function createEmptyReport(now = new Date(), roster?: MemberRoster): MinistryReport {
  const iso = now.toISOString();

  const elementaryMembers = (() => {
    if (roster?.departments.elementary.kind === "flat") {
      return roster.departments.elementary.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers(["권상우", "천주아"]);
  })();

  const middleHighMembers = (() => {
    if (roster?.departments.middleHigh.kind === "flat") {
      return roster.departments.middleHigh.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers([
      "김규인", "김주영", "김주혁", "이예진", "이태양",
      "이호석", "정서원", "정시원", "정소원",
      "김주찬", "변아영", "변현섭", "최우진",
    ]);
  })();

  const youngAdultMembers = (() => {
    if (roster?.departments.youngAdult.kind === "flat") {
      return roster.departments.youngAdult.members.map(m => ({
        id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
      }));
    }
    return createDepartmentMembers([
      "고현아", "김보은", "김정인", "김주은", "김태양",
      "라규미", "박시은", "신승환", "안수용", "유다희",
      "유세희", "이석준", "정은정", "정혜정", "차예담",
      "한상희", "한혜원", "황원영",
    ]);
  })();

  const adultZones = (() => {
    if (roster?.departments.adult.kind === "zoned") {
      return roster.departments.adult.zones.map(z => ({
        id: z.id,
        name: z.name,
        district: z.district,
        members: z.members.map(m => ({
          id: m.id, name: m.name, status: "present" as const, role: m.role, phone: m.phone,
        })),
      }));
    }
    return createAdultZones();
  })();

  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    title: "주간 사역보고서",
    reportDate: iso.slice(0, 10),
    churchName: "연천장로교회",
    pastorName: "",
    departments: {
      elementary: {
        key: "elementary",
        name: "유초등부",
        attendance: elementaryMembers.length,
        newVisitors: 0,
        summary: "",
        members: elementaryMembers,
      },
      middleHigh: {
        key: "middleHigh",
        name: "중고등부",
        attendance: middleHighMembers.length,
        newVisitors: 0,
        summary: "",
        members: middleHighMembers,
      },
      youngAdult: {
        key: "youngAdult",
        name: "청년부",
        attendance: youngAdultMembers.length,
        newVisitors: 0,
        summary: "",
        members: youngAdultMembers,
      },
      adult: {
        key: "adult",
        name: "장년",
        attendance: deriveAdultAttendance(adultZones),
        newVisitors: 0,
        summary: "",
        zones: adultZones,
      },
    },
    offerings: { total: 0, memo: "" },
    prayerRequests: [],
    announcements: [],
    createdAt: iso,
    updatedAt: iso,
  };
}

export function cloneReportAsDraft(
  report: MinistryReport,
  now = new Date(),
): MinistryReport {
  const iso = now.toISOString();
  const upgraded = upgradeReportForEditor(report);

  function cloneDept(dept: DepartmentReport): DepartmentReport {
    return {
      ...dept,
      members: dept.members?.map((m) => ({ ...m })),
      zones: dept.zones?.map((z) => ({
        ...z,
        members: z.members.map((m) => ({ ...m })),
      })),
    };
  }

  return {
    ...upgraded,
    id: crypto.randomUUID(),
    title: `${report.title} 복사본`,
    reportDate: iso.slice(0, 10),
    departments: {
      elementary: cloneDept(upgraded.departments.elementary),
      middleHigh: cloneDept(upgraded.departments.middleHigh),
      youngAdult: cloneDept(upgraded.departments.youngAdult),
      adult: cloneDept(upgraded.departments.adult),
    },
    offerings: { ...report.offerings },
    prayerRequests: [...report.prayerRequests],
    announcements: [...report.announcements],
    createdAt: iso,
    updatedAt: iso,
  };
}

export function upgradeReportForEditor(report: MinistryReport): MinistryReport {
  return {
    ...report,
    departments: {
      elementary: upgradeDepartmentToCards(report.departments.elementary),
      middleHigh: upgradeDepartmentToCards(report.departments.middleHigh),
      youngAdult: upgradeDepartmentToCards(report.departments.youngAdult),
      adult: upgradeDepartmentToCards(report.departments.adult),
    },
  };
}
