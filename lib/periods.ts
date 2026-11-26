import { q, Row } from "./db";
import { holidaysOf } from "./holidays";
import { daysInMonth } from "./calendar";

export type PeriodRow = { id: string; store_id: string; store_name: string; year: number; month: number; open: boolean };

export async function loadPeriod(pid: string): Promise<PeriodRow | null> {
  const rows = await q`SELECT p.id, p.store_id, s.name AS store_name, p.year, p.month, p.open
    FROM periods p JOIN stores s ON s.id = p.store_id WHERE p.id = ${pid}`;
  const r = rows[0];
  if (!r) return null;
  return {
    id: String(r.id),
    store_id: String(r.store_id),
    store_name: String(r.store_name),
    year: Number(r.year),
    month: Number(r.month),
    open: Boolean(r.open),
  };
}

export function periodPayload(p: PeriodRow) {
  return {
    id: p.id,
    storeId: p.store_id,
    storeName: p.store_name,
    year: p.year,
    month: p.month,
    open: p.open,
    days: daysInMonth(p.year, p.month),
    holidays: holidaysOf(p.year, p.month),
  };
}

export function memberPayload(r: Row, withCuts: boolean) {
  const base = {
    id: String(r.id),
    name: String(r.name),
    note: String(r.note ?? ""),
    off: ((r.off_days as number[]) ?? []).map(Number),
  };
  return withCuts ? { ...base, cuts: ((r.cut_days as number[]) ?? []).map(Number) } : base;
}

export function periodList(rows: Row[]) {
  return rows.map((r) => ({ id: String(r.id), year: Number(r.year), month: Number(r.month), open: Boolean(r.open) }));
}
