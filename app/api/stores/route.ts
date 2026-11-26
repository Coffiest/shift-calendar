import { q } from "@/lib/db";
import { hashPassword, cookieName, sessionToken } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { ok, fail, body } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const b = await body(req);
  const name = String(b.name ?? "").normalize("NFKC").trim().slice(0, 40);
  const password = String(b.password ?? "");
  if (!name) return fail("店名を入れてください");
  if (password.length < 4) return fail("パスワードは4文字以上にしてください");
  const id = newId(10);
  const pwHash = hashPassword(password);
  await q`INSERT INTO stores (id, name, pw_hash) VALUES (${id}, ${name}, ${pwHash})`;
  const jar = await cookies();
  jar.set(cookieName(id), sessionToken(id, pwHash), {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 180,
  });
  return ok({ id }, 201);
}
