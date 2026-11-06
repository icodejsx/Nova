/**
 * Signed session cookie — SERVER ONLY.
 *
 * Stateless: the cookie holds `email.expiry` plus an HMAC. Set AUTH_SECRET
 * (32+ random chars) in production. Without it, dev uses a fixed secret and
 * production uses a random per-process secret, so sessions end on restart.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "nova_session";
const MAX_AGE_S = 30 * 24 * 60 * 60;

const proc = globalThis as unknown as { __novaEphemeralSecret?: string };

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV !== "production") return "nova-dev-secret-change-me";
  return (proc.__novaEphemeralSecret ??= crypto.randomBytes(32).toString("hex"));
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const mac = (payload: string) =>
  crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

function sign(email: string, expiresAt: number): string {
  const payload = `${b64(email)}.${expiresAt}`;
  return `${payload}.${mac(payload)}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailPart, expiry, signature] = parts;
  const expected = mac(`${emailPart}.${expiry}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!(Number(expiry) > Date.now())) return null;
  return unb64(emailPart);
}

/** Email of the signed-in user, or null. */
export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}

export async function startSession(email: string) {
  const store = await cookies();
  const expiresAt = Date.now() + MAX_AGE_S * 1000;
  store.set(COOKIE, sign(email, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
