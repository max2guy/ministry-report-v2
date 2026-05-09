import type { DepartmentKey, DepartmentMemberRole } from "./reportTypes";

export type RosterMember = {
  id: string;
  name: string;
  role?: DepartmentMemberRole;
  phone?: string;
  group?: string; // 섹션 구분 (중고등부: "middle"/"high", 유초등부: "kindergarten"/"elementary")
};

export type RosterZone = {
  id: string;
  name: string;
  district: number;
  members: RosterMember[];
};

export type RosterDepartment =
  | { kind: "flat"; members: RosterMember[] }
  | { kind: "zoned"; zones: RosterZone[] };

export type MemberRoster = {
  departments: Record<DepartmentKey, RosterDepartment>;
  updatedAt: string;
};

export function createDefaultRoster(): MemberRoster {
  return {
    departments: {
      elementary: {
        kind: "flat",
        members: [
          { id: crypto.randomUUID(), name: "권상우" },
          { id: crypto.randomUUID(), name: "천주아" },
        ],
      },
      middleHigh: {
        kind: "flat",
        members: [
          "김규인","김주영","김주혁","이예진","이태양",
          "이호석","정서원","정시원","정소원",
          "김주찬","변아영","변현섭","최우진",
        ].map(name => ({ id: crypto.randomUUID(), name })),
      },
      youngAdult: {
        kind: "flat",
        members: [
          "고현아","김보은","김정인","김주은","김태양",
          "라규미","박시은","신승환","안수용","유다희",
          "유세희","이석준","정은정","정혜정","차예담",
          "한상희","한혜원","황원영",
        ].map(name => ({ id: crypto.randomUUID(), name })),
      },
      adult: {
        kind: "zoned",
        zones: createDefaultAdultZones(),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

function mkMember(name: string, role: DepartmentMemberRole): RosterMember {
  return { id: crypto.randomUUID(), name, role };
}
function mkZoneMember(name: string): RosterMember {
  return { id: crypto.randomUUID(), name, role: "member" };
}

function makeZone(name: string, district: number, members: RosterMember[]): RosterZone {
  return { id: crypto.randomUUID(), name, district, members };
}

function createDefaultAdultZones(): RosterZone[] {
  return [
    makeZone("1구역", 1, [
      mkMember("이명숙", "leader"), mkMember("김영순", "inspector"),
      ...["안성문","김명호","이종순","지정웅","임한나","정나단","조병옥","조병임","이덕재","최순복","양창운","최정분","황재희","전정예"].map(mkZoneMember),
    ]),
    makeZone("2구역", 1, [
      mkMember("민옥화", "leader"), mkMember("박진숙", "inspector"),
      ...["김두곤","송을범","심순덕","염재훈","이승숙","이윤형","당윤수","이지현","정현철","임금란","임희순","김석규","조남주"].map(mkZoneMember),
    ]),
    makeZone("3구역", 1, [
      mkMember("임미자", "leader"), mkMember("김성숙", "inspector"),
      ...["우정식","박영준","권옥자","류홍렬","박순옥","서유정","황흥도","이이순","김수근","최순옥","최현숙"].map(mkZoneMember),
    ]),
    makeZone("4구역", 1, [
      mkMember("임혜진", "leader"), mkMember("조성주", "inspector"),
      ...["임법상","김수년","김명옥","김애경","손정숙","김경석","유제경","엄동규","이도화","최인숙","이진우","황영숙","김주훈"].map(mkZoneMember),
    ]),
    makeZone("5구역", 1, [
      mkMember("오민자", "leader"), mkMember("이미자", "inspector"),
      ...["이상석","한준식","고분선","김교순","김혜진","노필언","박승애","박화자","유분의","이성희","이승현","이희열","임정숙","장국지","최종분"].map(mkZoneMember),
    ]),
    makeZone("6구역", 1, [
      mkMember("김순이", "leader"), mkMember("김미경", "inspector"),
      ...["김덕희","김은주","신영락","노학심","박순영","변기성","윤숙경","이순희","박종학","이춘생","최봉석","최태인"].map(mkZoneMember),
    ]),
    makeZone("7구역", 2, [
      mkMember("이정순", "leader"), mkMember("현명숙", "inspector"),
      ...["이규훈","권성배","김연자","김희수","송경섭","송현숙","김동호","유순하","박광천","이재선","조자형","양태모","한선분"].map(mkZoneMember),
    ]),
    makeZone("8구역", 2, [
      mkMember("김영숙", "leader"), mkMember("유미선", "inspector"),
      ...["나인용","권금애","김미순","김병기","김은정","김규보","심기동","원흥순","이현상","윤석현","최필남","정현숙","심완섭","최기환"].map(mkZoneMember),
    ]),
    makeZone("9구역", 2, [
      mkMember("양경순", "leader"), mkMember("전미영", "inspector"),
      ...["이봉열","강상희","고환필","김미용","모동수","박순복","박영철","윤여임","이영주","김효철","한정애"].map(mkZoneMember),
    ]),
    makeZone("10구역", 2, [
      mkMember("조옥희", "leader"), mkMember("성복임", "inspector"),
      ...["박양권","박덕순","윤정희","신임재","김건중","이명희","정대호","지정옥","고경설","이옥현","지행자","곽명희"].map(mkZoneMember),
    ]),
    makeZone("11구역", 2, [
      mkMember("최숙녀", "leader"), mkMember("최옥연", "inspector"),
      ...["한명식","박종금","송종란","전준석","이옥순","김명량","이한나","김광진","장월기","정국자","최기복","한승훈"].map(mkZoneMember),
    ]),
    makeZone("12구역", 2, [
      mkMember("유은희", "leader"), mkMember("조명숙", "inspector"),
      ...["안준용","이순용","강지아","나요나","전진구","박진아","정민시","이사라","천성현","최주희","정수미","민건우","한상미","윤승희"].map(mkZoneMember),
    ]),
  ];
}
