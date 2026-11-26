/** 画面・PNG・サーバーで共通に使う、日付まわりの計算 */

export type DayInfo = {
  day: number;
  /** 0=月 ... 6=日(月曜始まり) */
  col: number;
  holiday: string | null;
};

export const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function buildDays(year: number, month: number, holidays: Record<number, string>): DayInfo[] {
  const n = daysInMonth(year, month);
  const out: DayInfo[] = [];
  for (let d = 1; d <= n; d++) {
    const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    out.push({ day: d, col: (dow + 6) % 7, holiday: holidays[d] ?? null });
  }
  return out;
}

/** 月曜始まりの週ごとに並べる(月の外は null) */
export function buildWeeks(days: DayInfo[]): (DayInfo | null)[][] {
  const weeks: (DayInfo | null)[][] = [];
  let week: (DayInfo | null)[] = Array(days[0].col).fill(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

/** 人数の段階: 0人=濃い赤 / 1人=薄い赤 / 2〜4人=色なし / 5人=薄い青 / 6人以上=濃い青 */
export type Level = "r2" | "r1" | "n" | "b1" | "b2";
export function levelFor(count: number): Level {
  if (count <= 0) return "r2";
  if (count === 1) return "r1";
  if (count <= 4) return "n";
  if (count === 5) return "b1";
  return "b2";
}

export function normalizeName(raw: string): string {
  return raw.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function sanitizeDays(input: unknown, max: number): number[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<number>();
  for (const v of input) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= max) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}
