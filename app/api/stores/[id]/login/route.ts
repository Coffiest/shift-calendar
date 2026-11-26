import { q } from "@/lib/db";
import { verifyPassword, cookieName, sessionToken } from "@/lib/auth";
import { ok, fail, body } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = await body(req);
  const rows = await q`SELECT pw_hash FROM stores WHERE id = ${id}`;
  if (!rows[0]) return fail("お店が見つかりません", 404);
  const pwHash = String(rows[0].pw_hash);
  if (!verifyPassword(String(b.password ?? ""), pwHash)) {
    await new Promise((r) => setTimeout(r, 800));
    return fail("パスワードが違います", 401);
  }
  const jar = await cookies();
  jar.set(cookieName(id), sessionToken(id, pwHash), {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 180,
  });
  return ok({ ok: true });
}
