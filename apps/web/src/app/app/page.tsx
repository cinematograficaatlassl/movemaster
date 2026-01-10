"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { getActiveWorkspaceId } from "@/lib/workspace/bootstrap";
import { subscribeTasks, type Task } from "@/lib/firestore/tasks";
import { createTask } from "@/lib/firestore/taskCrud";

export default function AppHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wsId, setWsId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setWsId(getActiveWorkspaceId());
  }, []);

  useEffect(() => {
    if (!wsId) return;
    setErr("");
    const unsub = subscribeTasks(wsId, {}, setTasks, (e: any) => setErr(e?.message ?? "Error cargando tareas"));
    return () => unsub();
  }, [wsId]);

  const pending = useMemo(() => tasks.filter((t) => t.status !== "Done"), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === "Done"), [tasks]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-500">You&apos;ve got</div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-900">
              {pending.length} tareas pendientes
            </div>
            <div className="mt-1 text-sm text-zinc-500">Workspace: {wsId ?? "…"}</div>
          </div>
          <Link
            href="/app/board"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Ver tablero
          </Link>
        </div>

        {err ? <div className="mt-4 text-sm text-rose-600">{err}</div> : null}

        <div className="mt-6">
          <div className="text-lg font-semibold text-zinc-900">My tasks</div>
          <div className="mt-3 grid gap-3">
            {pending.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href={`/app/tasks/${t.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900">{t.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-600">
                      <span className="rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-200">{t.area}</span>
                      <span className="rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-200">{t.status}</span>
                      <span className="rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-200">{t.category}</span>
                    </div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--mm-accent)] text-zinc-900 font-black">
                    ✓
                  </div>
                </div>
              </Link>
            ))}
            {pending.length === 0 ? <div className="text-sm text-zinc-600">No hay tareas pendientes.</div> : null}
          </div>
        </div>
      </section>

      <aside className="grid gap-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">Resumen</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="text-xs text-zinc-500">Pendientes</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{pending.length}</div>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="text-xs text-zinc-500">Done</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{done.length}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
              <div className="text-2xl font-semibold text-zinc-900">Today</div>
            </div>
            <button
              className="h-11 rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              disabled={!wsId || !user?.uid || creating}
              onClick={async () => {
                if (!wsId || !user?.uid) return;
                try {
                  setCreating(true);
                  const id = await createTask(wsId, user.uid, { title: "Nueva tarea", area: "ESPAÑA" });
                  router.push(`/app/tasks/${id}`);
                } catch (e: any) {
                  setErr(e?.message ?? "No se pudo crear la tarea.");
                } finally {
                  setCreating(false);
                }
              }}
            >
              + Add task
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--mm-accent)] p-4 text-zinc-900">
            <div className="text-sm font-semibold">Bloque crítico</div>
            <div className="mt-1 text-sm opacity-80">
              Renovar e.firma (SAT) → desbloquea Alta Hacienda y SAT Deuda.
            </div>
          </div>
          <div className="mt-4 text-sm text-zinc-600">
            (Calendario/timeline lo conectamos en la siguiente iteración.)
          </div>
        </div>
      </aside>
    </div>
  );
}

