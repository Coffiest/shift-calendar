import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { ok, fail, body } from "@/lib/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await requireAdmin(id))) return fail("ログインしてください", 401);
  const b = await body(req);
  const year = Number(b.year);
  const month = Number(b.month);
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return fail("年月が正しくありません");
  }
  const dup = await q`SELECT id FROM periods WHERE store_id = ${id} AND year = ${year} AND month = ${month}`;
  if (dup[0]) return fail(`${year}年${month}月はもう作ってあります`, 409);
  const pid = newId(12);
  await q`INSERT INTO periods (id, store_id, year, month) VALUES (${pid}, ${id}, ${year}, ${month})`;
  return ok({ id: pid }, 201);
}
