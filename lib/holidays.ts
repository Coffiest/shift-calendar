import holidayJp from "@holiday-jp/holiday_jp";

/** その月の祝日を { 日: 名前 } で返す(サーバーでだけ使う。データが大きいので画面に積まない) */
export function holidaysOf(year: number, month: number): Record<number, string> {
  const out: Record<number, string> = {};
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const all = (holidayJp as unknown as { holidays: Record<string, { name: string }> }).holidays;
  for (const [key, v] of Object.entries(all)) {
    if (key.startsWith(prefix)) out[Number(key.slice(prefix.length))] = v.name;
  }
  return out;
}
