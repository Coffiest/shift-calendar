import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, body } from "@/lib/http";
import { loadPeriod } from "@/lib/periods";
import { daysInMonth, sanitizeDays } from "@/lib/calendar";

type Ctx = { params: Promise<{ mid: string }> };

async function loadMember(mid: string) {
  const rows = await q`SELECT id, period_id FROM members WHERE id = ${mid}`;
  if (!rows[0]) return null;
  const p = await loadPeriod(String(rows[0].period_id));
  return p ? { id: mid, period: p } : null;
}

/** バイトが自分の休み希望と備考を直す */
export async function PUT(req: Request, ctx: Ctx) {
  const { mid } = await ctx.params;
  const m = await loadMember(mid);
  if (!m) return fail("回答が見つかりません", 404);
  if (!m.period.open) return fail("この月の受付は終了しました", 403);
  const b = await body(req);
  const note = String(b.note ?? "").slice(0, 500);
  const off = sanitizeDays(b.off, daysInMonth(m.period.year, m.period.month));
  await q`UPDATE members SET note = ${note}, off_days = ${off} WHERE id = ${mid}`;
  return ok({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { mid } = await ctx.params;
  const m = await loadMember(mid);
  if (!m) return fail("回答が見つかりません", 404);
  if (!(await requireAdmin(m.period.store_id))) return fail("ログインしてください", 401);
  await q`DELETE FROM members WHERE id = ${mid}`;
  return ok({ ok: true });
}
