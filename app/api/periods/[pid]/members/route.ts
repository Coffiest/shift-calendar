import { q } from "@/lib/db";
import { newId } from "@/lib/ids";
import { ok, fail, body } from "@/lib/http";
import { loadPeriod } from "@/lib/periods";
import { daysInMonth, normalizeName, sanitizeDays } from "@/lib/calendar";

export async function POST(req: Request, ctx: { params: Promise<{ pid: string }> }) {
  const { pid } = await ctx.params;
  const p = await loadPeriod(pid);
  if (!p) return fail("この月は見つかりません", 404);
  if (!p.open) return fail("この月の受付は終了しました", 403);
  const b = await body(req);
  const name = normalizeName(String(b.name ?? "")).slice(0, 20);
  if (!name) return fail("名前を入れてください");
  const note = String(b.note ?? "").slice(0, 500);
  const off = sanitizeDays(b.off, daysInMonth(p.year, p.month));
  const dup = await q`SELECT id FROM members WHERE period_id = ${pid} AND name = ${name}`;
  if (dup[0]) return fail("その名前はもう使われています。自分なら、上の一覧から名前を押して編集してください", 409);
  const id = newId(12);
  await q`INSERT INTO members (id, period_id, name, note, off_days) VALUES (${id}, ${pid}, ${name}, ${note}, ${off})`;
  return ok({ id }, 201);
}
