"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { getActiveWorkspaceId } from "@/lib/workspace/bootstrap";
import { subscribeTasks, type Task, setTaskStatus, snoozeTask } from "@/lib/firestore/tasks";
import { subscribeMyMemberDoc } from "@/lib/firestore/members";

const AREAS = ["ESPAÑA", "ATLAS", "MEXICO", "DUBAI"] as const;
const STATUSES = ["To do", "In progress", "Waiting", "Blocked", "Done"] as const;

function badgeClass(kind: "area" | "status", value: string) {
  if (kind === "status") {
    if (value === "Done") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (value === "Blocked") return "bg-rose-50 text-rose-700 ring-rose-200";
    if (value === "Waiting") return "bg-amber-50 text-amber-700 ring-amber-200";
    if (value === "In progress") return "bg-blue-50 text-blue-700 ring-blue-200";
    return "bg-zinc-50 text-zinc-700 ring-zinc-200";
  }
  // area
  if (value === "ESPAÑA") return "bg-purple-50 text-purple-700 ring-purple-200";
  if (value === "MEXICO") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value === "DUBAI") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200"; // ATLAS
}

export default function BoardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wsId, setWsId] = useState<string | null>(null);
  const [snoozeDays, setSnoozeDays] = useState<number>(2);
  const [snoozeOptions, setSnoozeOptions] = useState<number[]>([1, 2, 7, 14]);

  const [area, setArea] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const id = getActiveWorkspaceId();
    setWsId(id);
  }, []);

  useEffect(() => {
    if (!wsId || !user?.uid) return;
    const unsub = subscribeMyMemberDoc(
      wsId,
      user.uid,
      (m) => {
        const prefs = m?.snoozePrefs;
        if (prefs?.optionsDays?.length) setSnoozeOptions(prefs.optionsDays);
        if (typeof prefs?.defaultDays === "number") setSnoozeDays(prefs.defaultDays);
      },
      () => {}
    );
    return () => unsub();
  }, [wsId, user?.uid]);

  const filters = useMemo(() => ({ area: area || undefined, status: status || undefined }), [area, status]);
  const indexLink = useMemo(() => {
    if (!err) return null;
    const m = err.match(/https?:\/\/\S+/);
    return m?.[0] ?? null;
  }, [err]);

  useEffect(() => {
    if (!wsId) return;
    setErr("");
    const unsub = subscribeTasks(wsId, filters, setTasks, (e: any) => setErr(e?.message ?? "Error cargando tareas"));
    return () => unsub();
  }, [wsId, filters]);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tablero</h1>
          <p className="text-sm text-zinc-600">Realtime + filtros. Swipe móvil y tabla desktop: siguiente iteración.</p>
        </div>
        <div className="text-sm text-zinc-500">{tasks.length} tareas</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <select
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">Área</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
        </select>
        <select
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Estado</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <select
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm"
            value={String(snoozeDays)}
            onChange={(e) => setSnoozeDays(Number(e.target.value))}
            title="Snooze (días)"
          >
            {snoozeOptions.map((d) => (
              <option key={d} value={String(d)}>
                Snooze: {d}d
              </option>
            ))}
        </select>
        <button
            className="ml-auto h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => {
              setArea("");
              setStatus("");
            }}
          >
            Limpiar
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <div className="font-semibold">Firestore necesita un índice</div>
          <div className="mt-1 text-rose-900/80">Abre el link y crea el índice; tarda 1–2 min.</div>
          {indexLink ? (
            <a className="mt-2 block break-all font-medium underline" href={indexLink} target="_blank" rel="noreferrer">
              {indexLink}
            </a>
          ) : (
            <div className="mt-2 break-all text-xs text-rose-900/80">{err}</div>
          )}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {tasks.map((t) => (
            <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/app/tasks/${t.id}`} className="text-sm font-semibold text-zinc-900 underline">
                    {t.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-600">
                    <span className={`rounded-full px-2 py-1 ring-1 ${badgeClass("area", t.area)}`}>{t.area}</span>
                    <span className={`rounded-full px-2 py-1 ring-1 ${badgeClass("status", t.status)}`}>{t.status}</span>
                    <span className="rounded-full bg-zinc-50 px-2 py-1 text-zinc-700 ring-1 ring-zinc-200">{t.category}</span>
                    {t.cost?.amount ? (
                      <span className="rounded-full bg-zinc-50 px-2 py-1 text-zinc-700 ring-1 ring-zinc-200">
                        Coste: {t.cost.amount} {t.cost.currency}
                      </span>
                    ) : null}
                    {t.deposit?.amount ? (
                      <span className="rounded-full bg-zinc-50 px-2 py-1 text-zinc-700 ring-1 ring-zinc-200">
                        Depósito: {t.deposit.amount} {t.deposit.currency}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    className="h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                    onClick={async () => {
                      if (!wsId || !user?.uid) return;
                      await snoozeTask(wsId, t.id, snoozeDays, user.uid);
                    }}
                  >
                    Snooze
                  </button>
                  <button
                    className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    onClick={async () => {
                      if (!wsId || !user?.uid) return;
                      await setTaskStatus(wsId, t.id, "Done", user.uid);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
        ))}

        {wsId && tasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-zinc-700 shadow-sm">
            No hay tareas con estos filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}

