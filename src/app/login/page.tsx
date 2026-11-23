"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <form action={action} className="w-full max-w-sm space-y-4">
        <img src="/logo.png" alt="PRIMEX Tinting & Protection Centre" className="mx-auto h-20" />
        <h1 className="text-center text-xl font-semibold">Job Card Sign In</h1>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input className="input" id="username" name="username" autoComplete="username" autoCapitalize="none" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
