import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, body } from "@/lib/http";
import { loadPeriod, periodPayload, memberPayload } from "@/lib/periods";

type Ctx = { params: Promise<{ pid: string }> };

/** バイト向け: 月の情報と、回答済みの人(削った日は見せない) */
export async function GET(_req: Request, ctx: Ctx) {
  const { pid } = await ctx.params;
  const p = await loadPeriod(pid);
  if (!p) return fail("この月は見つかりません", 404);
  const rows = await q`SELECT id, name, note, off_days FROM members WHERE period_id = ${pid} ORDER BY created_at, name`;
  return ok({ period: periodPayload(p), members: rows.map((r) => memberPayload(r, false)) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { pid } = await ctx.params;
  const p = await loadPeriod(pid);
  if (!p) return fail("この月は見つかりません", 404);
  if (!(await requireAdmin(p.store_id))) return fail("ログインしてください", 401);
  const b = await body(req);
  if (typeof b.open !== "boolean") return fail("open が必要です");
  await q`UPDATE periods SET open = ${b.open} WHERE id = ${pid}`;
  return ok({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { pid } = await ctx.params;
  const p = await loadPeriod(pid);
  if (!p) return fail("この月は見つかりません", 404);
  if (!(await requireAdmin(p.store_id))) return fail("ログインしてください", 401);
  await q`DELETE FROM periods WHERE id = ${pid}`;
  return ok({ ok: true });
}
