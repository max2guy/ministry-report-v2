import type { DepartmentZone } from "../../domain/reportTypes";

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function buildZoneSmsMessage(zone: DepartmentZone, date: string): string {
  const absent = zone.members.filter(m => m.status === "absent");
  if (!absent.length) return "";
  const names = absent.map(m => m.name).join(" ");
  return `[${date} 주일 결석 현황]\n${zone.name} 결석자 ${absent.length}명\n${names}`;
}

export function buildDistrictSmsMessage(
  district: number,
  zones: DepartmentZone[],
  date: string,
): string {
  const districtZones = zones.filter(z => z.district === district);
  const lines = districtZones
    .filter(z => z.members.some(m => m.status === "absent"))
    .map(z => {
      const names = z.members.filter(m => m.status === "absent").map(m => m.name).join(" ");
      return `${z.name}: ${names}`;
    });
  if (!lines.length) return "";
  const total = districtZones.reduce(
    (sum, z) => sum + z.members.filter(m => m.status === "absent").length,
    0,
  );
  return `[${date} 주일 결석 현황]\n${district}교구 총 결석 ${total}명\n\n${lines.join("\n")}`;
}

export type SmsTarget = {
  id: string;
  label: string;
  leaderName: string;
  phone: string | undefined;
  msg: string;
};

export function buildSmsTargets(zones: DepartmentZone[], reportDate: string): SmsTarget[] {
  const targets: SmsTarget[] = [];

  zones.forEach((zone, i) => {
    const msg = buildZoneSmsMessage(zone, reportDate);
    if (!msg) return;
    const leader = zone.members.find(m => m.role === "leader");
    targets.push({
      id: `z${i}`,
      label: zone.name,
      leaderName: `${zone.name}장 ${leader?.name ?? ""}`,
      phone: leader?.phone,
      msg,
    });
  });

  [1, 2].forEach(district => {
    const distZones = zones.filter(z => z.district === district);
    const msg = buildDistrictSmsMessage(district, zones, reportDate);
    if (!msg) return;
    const firstZone = distZones[0];
    const leader = firstZone?.members.find(m => m.role === "leader");
    targets.push({
      id: `d${district}`,
      label: `${district}교구 전체`,
      leaderName: `${district}교구장 ${leader?.name ?? ""}`,
      phone: leader?.phone,
      msg,
    });
  });

  return targets;
}
