"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { logout } from "@/lib/auth/actions";
import { getActiveWorkspaceId } from "@/lib/workspace/bootstrap";

function initials(nameOrEmail: string) {
  const s = (nameOrEmail ?? "").trim();
  if (!s) return "?";
  const parts = s.replace(/@.*/, "").split(/[.\s_-]+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "?").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return (a + b).slice(0, 2);
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-white/10 text-white" : "text-zinc-200 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/app", label: "Home" },
    { href: "/app/board", label: "Tablero" },
    { href: "/app/settings", label: "Ajustes" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-4 py-2">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-semibold",
                active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const wsId = useMemo(() => getActiveWorkspaceId(), []);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="mx-auto grid min-h-dvh max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:flex-col md:justify-between bg-zinc-950 text-white">
          <div className="p-4">
            <Link href="/app" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--mm-accent)] text-zinc-900 font-black">
                M
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-5">MoveMaster</div>
                <div className="truncate text-xs text-white/60">Mudanza BCN → MX</div>
              </div>
            </Link>

            <div className="mt-6 grid gap-1">
              <NavLink href="/app" label="Dashboard" />
              <NavLink href="/app/board" label="My tasks" />
              <NavLink href="/app/settings" label="Settings" />
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="text-xs font-semibold text-white/60">Workspace</div>
              <div className="mt-1 truncate text-xs text-white/80">{wsId ?? "…"}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-sm font-bold">
                    {initials(user?.displayName ?? user?.email ?? "")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{user?.displayName ?? "Cuenta"}</div>
                    <div className="truncate text-[11px] text-white/60">{user?.email ?? ""}</div>
                  </div>
                </div>
                <button
                  className="h-9 rounded-xl bg-white/10 px-3 text-xs font-semibold hover:bg-white/15"
                  onClick={async () => {
                    await logout();
                    router.replace("/login");
                  }}
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500">
                    Hola{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Dashboard
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="hidden md:block">
                    <div className="relative">
                      <input
                        className="h-11 w-[360px] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-zinc-300"
                        placeholder="Search something…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-white text-sm font-bold">
                    {initials(user?.displayName ?? user?.email ?? "")}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-10">{children}</main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

