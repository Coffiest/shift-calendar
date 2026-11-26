import { randomBytes } from "crypto";
const ALPHA = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newId(len = 12): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[bytes[i] % ALPHA.length];
  return s;
}
