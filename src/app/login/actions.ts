"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, loginLocked, recordLogin, verifyPassword } from "@/lib/auth";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (loginLocked(username)) return "Too many attempts. Try again in 5 minutes.";
  const [u] = await db.select().from(users).where(eq(users.username, username));
  const ok = !!u && verifyPassword(password, u.passwordHash);
  recordLogin(username, ok);
  if (!ok) return "Incorrect username or password.";
  await createSession({ uid: u.id, role: u.role, name: u.name });
  redirect(u.role === "admin" ? "/admin" : "/staff");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
