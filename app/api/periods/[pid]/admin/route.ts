import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { loadPeriod, periodPayload, memberPayload } from "@/lib/periods";

export async function GET(_req: Request, ctx: { params: Promise<{ pid: string }> }) {
  const { pid } = await ctx.params;
  const p = await loadPeriod(pid);
  if (!p) return fail("この月は見つかりません", 404);
  if (!(await requireAdmin(p.store_id))) return fail("ログインしてください", 401);
  const rows = await q`SELECT id, name, note, off_days, cut_days FROM members WHERE period_id = ${pid} ORDER BY created_at, name`;
  return ok({ period: periodPayload(p), members: rows.map((r) => memberPayload(r, true)) });
}
