import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "admin" | "staff";
export type Session = { uid: number; role: Role; name: string; exp: number };

const COOKIE = "jc_session";
const TTL_S = 12 * 60 * 60; // one working day

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return s;
}
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(s: Omit<Session, "exp">) {
  const data = Buffer.from(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + TTL_S })).toString("base64url");
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_S,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const s = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
  return s.exp > Date.now() / 1000 ? s : null;
}

/** For pages: redirect to login (or home) when not allowed. */
export async function requireRole(...roles: Role[]) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!roles.includes(s.role)) redirect("/");
  return s;
}

/** For route handlers: returns a session or a Response to send back. */
export async function apiAuth(...roles: Role[]): Promise<Session | Response> {
  const s = await getSession();
  if (!s) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roles.includes(s.role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return s;
}

// ponytail: in-memory login throttle, single app instance only; move to the DB if you ever scale out.
const failures = new Map<string, { n: number; until: number }>();
export function loginLocked(username: string) {
  const f = failures.get(username);
  return !!f && f.until > Date.now();
}
export function recordLogin(username: string, ok: boolean) {
  if (ok) return void failures.delete(username);
  const f = failures.get(username) ?? { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= 5) { f.until = Date.now() + 5 * 60_000; f.n = 0; }
  failures.set(username, f);
}
