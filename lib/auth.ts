import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { q } from "./db";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 32);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = scryptSync(pw, Buffer.from(saltHex, "hex"), 32);
  const want = Buffer.from(keyHex, "hex");
  return want.length === key.length && timingSafeEqual(key, want);
}

function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    createHash("sha256").update(`shift-calendar:${process.env.DATABASE_URL ?? ""}`).digest("hex")
  );
}

export function cookieName(storeId: string) {
  return `sc_admin_${storeId}`;
}

/** パスワードのハッシュも混ぜるので、パスワードを変えれば古いログインは無効になる */
export function sessionToken(storeId: string, pwHash: string): string {
  return createHmac("sha256", secret()).update(`${storeId}|${pwHash}`).digest("hex");
}

/** 店長としてログインしているか。店が無い・ログインしていないときは null */
export async function requireAdmin(storeId: string): Promise<{ id: string; name: string } | null> {
  const rows = await q`SELECT id, name, pw_hash FROM stores WHERE id = ${storeId}`;
  const store = rows[0];
  if (!store) return null;
  const jar = await cookies();
  const got = jar.get(cookieName(storeId))?.value ?? "";
  const want = sessionToken(storeId, String(store.pw_hash));
  if (got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return null;
  return { id: String(store.id), name: String(store.name) };
}
