import { q } from "@/lib/db";
import { ok, fail } from "@/lib/http";
import { periodList } from "@/lib/periods";

/** バイト向け: 店名と、受付中の月だけ */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const stores = await q`SELECT name FROM stores WHERE id = ${id}`;
  if (!stores[0]) return fail("お店が見つかりません", 404);
  const periods = await q`SELECT id, year, month, open FROM periods
    WHERE store_id = ${id} AND open = true ORDER BY year, month`;
  return ok({ name: String(stores[0].name), periods: periodList(periods) });
}
