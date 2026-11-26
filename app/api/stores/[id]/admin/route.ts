import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { periodList } from "@/lib/periods";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const exists = await q`SELECT name FROM stores WHERE id = ${id}`;
  if (!exists[0]) return fail("お店が見つかりません", 404);
  const store = await requireAdmin(id);
  if (!store) return ok({ authed: false, name: String(exists[0].name) });
  const periods = await q`SELECT id, year, month, open FROM periods WHERE store_id = ${id} ORDER BY year, month`;
  return ok({ authed: true, name: store.name, periods: periodList(periods) });
}
