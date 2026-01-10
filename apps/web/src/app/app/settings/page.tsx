"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { getActiveWorkspaceId } from "@/lib/workspace/bootstrap";
import { subscribeMyMemberDoc, updateMySnoozePrefs, type SnoozePrefs } from "@/lib/firestore/members";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wsId, setWsId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<SnoozePrefs>({ defaultDays: 2, optionsDays: [1, 2, 7, 14] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setWsId(getActiveWorkspaceId());
  }, []);

  useEffect(() => {
    if (!wsId || !user?.uid) return;
    const unsub = subscribeMyMemberDoc(wsId, user.uid, (m) => {
      if (m?.snoozePrefs) setPrefs(m.snoozePrefs);
    });
    return () => unsub();
  }, [wsId, user?.uid]);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Ajustes</h1>
            <p className="text-sm text-zinc-600">Preferencias por usuario</p>
          </div>
          <Link className="text-sm font-medium text-zinc-900 underline" href="/app/board">
            Volver
          </Link>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">Snooze</div>
          <p className="mt-1 text-sm text-zinc-600">
            Define el número de días por defecto al pulsar “Snooze”.
          </p>

          <div className="mt-4 grid gap-2">
            <label className="text-xs font-medium text-zinc-700">Snooze por defecto (días)</label>
            <select
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              value={String(prefs.defaultDays)}
              onChange={(e) => setPrefs((p) => ({ ...p, defaultDays: Number(e.target.value) }))}
            >
              {prefs.optionsDays.map((d) => (
                <option key={d} value={String(d)}>
                  {d} días
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50"
              disabled={!wsId || !user?.uid || busy}
              onClick={async () => {
                if (!wsId || !user?.uid) return;
                try {
                  setBusy(true);
                  await updateMySnoozePrefs(wsId, user.uid, prefs);
                  setMsg("Guardado.");
                } catch (e: any) {
                  setMsg(e?.message ?? "No se pudo guardar.");
                } finally {
                  setBusy(false);
                  setTimeout(() => setMsg(""), 1500);
                }
              }}
            >
              Guardar
            </button>
            {msg ? <div className="self-center text-sm text-zinc-700">{msg}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

