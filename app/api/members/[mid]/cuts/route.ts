import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, body } from "@/lib/http";
import { loadPeriod } from "@/lib/periods";
import { daysInMonth, sanitizeDays } from "@/lib/calendar";

/** 店長が「その日は出勤なし」にした日を丸ごと置き換える */
export async function PUT(req: Request, ctx: { params: Promise<{ mid: string }> }) {
  const { mid } = await ctx.params;
  const rows = await q`SELECT period_id FROM members WHERE id = ${mid}`;
  if (!rows[0]) return fail("回答が見つかりません", 404);
  const p = await loadPeriod(String(rows[0].period_id));
  if (!p) return fail("この月は見つかりません", 404);
  if (!(await requireAdmin(p.store_id))) return fail("ログインしてください", 401);
  const b = await body(req);
  const cuts = sanitizeDays(b.cuts, daysInMonth(p.year, p.month));
  await q`UPDATE members SET cut_days = ${cuts} WHERE id = ${mid}`;
  return ok({ ok: true });
}
