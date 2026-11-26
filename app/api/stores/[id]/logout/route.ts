import { cookieName } from "@/lib/auth";
import { ok } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();
  jar.delete(cookieName(id));
  return ok({ ok: true });
}
