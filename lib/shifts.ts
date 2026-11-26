import type { Member } from "./types";

/** その日に出勤する人(休み希望でなく、店長が削っていない人)。並びは登録順 */
export function workersOn(members: Member[], day: number): Member[] {
  return members.filter((m) => !m.off.includes(day) && !(m.cuts ?? []).includes(day));
}
/** その日に出勤できる人(休み希望でない人)。削られた人も含む */
export function availableOn(members: Member[], day: number): Member[] {
  return members.filter((m) => !m.off.includes(day));
}
export function workDays(m: Member, days: number): number {
  let n = 0;
  for (let d = 1; d <= days; d++) if (!m.off.includes(d) && !(m.cuts ?? []).includes(d)) n++;
  return n;
}
