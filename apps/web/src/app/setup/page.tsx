"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  clearStoredFirebaseConfig,
  getStoredFirebaseConfig,
  setStoredFirebaseConfig,
  type RuntimeFirebaseConfig,
} from "@/lib/firebase/runtimeConfig";
import { getFirebaseConfigStatus } from "@/lib/firebase/runtimeConfig";

const EMPTY: RuntimeFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export default function SetupPage() {
  const initial = useMemo(() => {
    const st = getFirebaseConfigStatus();
    return (st.config ?? getStoredFirebaseConfig() ?? EMPTY) as RuntimeFirebaseConfig;
  }, []);
  const [cfg, setCfg] = useState<RuntimeFirebaseConfig>(initial);
  const [msg, setMsg] = useState("");
  const [snippet, setSnippet] = useState("");

  function tryParseSnippet(raw: string): Partial<RuntimeFirebaseConfig> | null {
    // Soporta:
    // - const firebaseConfig = { apiKey: "...", ... }
    // - JSON {"apiKey":"..."}
    // - líneas sueltas apiKey: "..."
    const pick = (k: keyof RuntimeFirebaseConfig) => {
      const r = new RegExp(`${k}\\s*[:=]\\s*["']([^"']+)["']`);
      const m = raw.match(r);
      return m?.[1];
    };
    const parsed: any = {};
    for (const k of ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"] as const) {
      parsed[k] = pick(k);
    }
    const ok = Object.values(parsed).filter(Boolean).length >= 2;
    if (ok) return parsed;
    try {
      const j = JSON.parse(raw);
      return j;
    } catch {
      return null;
    }
  }

  const canSave =
    !!cfg.apiKey &&
    !!cfg.authDomain &&
    !!cfg.projectId &&
    !!cfg.storageBucket &&
    !!cfg.messagingSenderId &&
    !!cfg.appId;

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Setup Firebase</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Pega aquí el “Web App config” de Firebase. Se guarda en tu navegador (localStorage).
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-zinc-900 underline">
            Volver
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Pegar snippet (opcional)</label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder='Pega aquí el snippet "firebaseConfig" completo…'
            />
            <div className="mt-2 flex gap-2">
              <button
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900"
                onClick={() => {
                  const p = tryParseSnippet(snippet.trim());
                  if (!p) {
                    setMsg("No pude parsear el snippet.");
                    setTimeout(() => setMsg(""), 1500);
                    return;
                  }
                  setCfg((c) => ({ ...c, ...(p as any) }));
                  setMsg("Snippet aplicado.");
                  setTimeout(() => setMsg(""), 1200);
                }}
              >
                Autocompletar
              </button>
            </div>
          </div>

          {(
            [
              ["apiKey", "apiKey"],
              ["authDomain", "authDomain"],
              ["projectId", "projectId"],
              ["storageBucket", "storageBucket"],
              ["messagingSenderId", "messagingSenderId"],
              ["appId", "appId"],
            ] as Array<[keyof RuntimeFirebaseConfig, string]>
          ).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-medium text-zinc-700">{label}</label>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                value={cfg[k]}
                onChange={(e) => setCfg((c) => ({ ...c, [k]: e.target.value }))}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!canSave}
            onClick={() => {
              setStoredFirebaseConfig(cfg);
              setMsg("Guardado. Recargando…");
              setTimeout(() => window.location.assign("/login"), 300);
            }}
          >
            Guardar y abrir login
          </button>
          <button
            className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900"
            onClick={() => {
              clearStoredFirebaseConfig();
              setCfg(EMPTY);
              setMsg("Borrado.");
              setTimeout(() => setMsg(""), 1000);
            }}
          >
            Borrar
          </button>
          {msg ? <div className="self-center text-sm text-zinc-700">{msg}</div> : null}
        </div>

        <div className="mt-6 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
          Lo encuentras en Firebase Console → Project settings → Your apps → Web app → “Firebase SDK snippet (Config)”.
        </div>
      </div>
    </div>
  );
}

