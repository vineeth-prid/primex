import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "./login/actions";
import "./globals.css";

export const metadata: Metadata = { title: "PRIMEX Job Card" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {s && (
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-neutral-200 bg-white px-4 py-2">
            <Link href="/"><img src="/logo.png" alt="PRIMEX" className="h-9" /></Link>
            <nav className="flex gap-1 text-sm font-medium">
              {s.role === "admin" && <Link className="rounded px-3 py-2 hover:bg-neutral-100" href="/admin">Dashboard</Link>}
              <Link className="rounded px-3 py-2 hover:bg-neutral-100" href="/staff">New Job Card</Link>
              <Link className="rounded px-3 py-2 hover:bg-neutral-100" href="/staff/delivery">Delivery</Link>
            </nav>
            <form action={logout} className="ml-auto flex items-center gap-3 text-sm">
              <span className="hidden text-neutral-500 sm:inline">{s.name}</span>
              <button className="rounded px-3 py-2 hover:bg-neutral-100">Sign out</button>
            </form>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
