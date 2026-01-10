"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeGoogleRedirect, completeMagicLink, isEmailLink, sendMagicLink, signInGoogle } from "@/lib/auth/actions";
import { useAuth } from "@/lib/auth/useAuth";
import { bootstrapWorkspace } from "@/lib/workspace/bootstrap";
import { firebaseConfigMissing, firebaseConfigSource } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string>("");

  const missing = firebaseConfigMissing;

  useEffect(() => {
    (async () => {
      // Captura errores/resultado de Google redirect (si aplica)
      try {
        const res = await completeGoogleRedirect();
        if (res?.user) {
          setStatus("Sesión iniciada. Preparando workspace…");
        }
      } catch (e: any) {
        setStatus(
          e?.message ??
            e?.code ??
            "No se pudo completar el login (redirect). Revisa Google provider y dominios autorizados."
        );
      }

      if (loading) return;

      // Completar email-link si aplica
      if (typeof window !== "undefined" && isEmailLink(window.location.href)) {
        try {
          setBusy(true);
          setStatus("Completando acceso por email…");
          await completeMagicLink(window.location.href);
        } catch (e: any) {
          setStatus(e?.message ?? "No se pudo completar el acceso por email.");
        } finally {
          setBusy(false);
        }
      }
    })();
  }, [loading]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setBusy(true);
        setStatus("Preparando tu workspace…");
        await bootstrapWorkspace();
        router.replace("/app");
      } catch (e: any) {
        const msg =
          e?.message ??
          "No se pudo crear/cargar el workspace (posible: Functions no desplegadas o permisos de Auth).";
        setBootstrapError(msg);
        setStatus(msg);
      } finally {
        setBusy(false);
      }
    })();
  }, [user, router]);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">MoveMaster</h1>
        <p className="mt-1 text-sm text-zinc-600">
          App colaborativa para la mudanza internacional (workspace familiar en tiempo real).
        </p>

        <div className="mt-3 text-xs text-zinc-500">
          Firebase config: <span className="font-medium">{firebaseConfigSource}</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Auth:{" "}
          <span className="font-medium">
            {loading ? "loading" : user ? `signed-in (${user.uid})` : "signed-out"}
          </span>
        </div>

        {missing.length ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-semibold">Configura Firebase para poder iniciar sesión</div>
            <div className="mt-1 text-amber-900/80">
              En este entorno puedes configurarlo desde la app:
            </div>
            <div className="mt-3">
              <Link
                href="/setup"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white"
              >
                Abrir setup
              </Link>
            </div>
            <div className="mt-3 text-xs text-amber-900/80">
              (Opcional) vía archivo: crea <code className="rounded bg-amber-100 px-1">apps/web/.env.local</code> copiando{" "}
              <code className="rounded bg-amber-100 px-1">apps/web/env.example</code> y rellena: {missing.join(", ")}
            </div>
            <div className="mt-3 text-xs text-amber-900/80">
              Luego reinicia el dev server (<code className="rounded bg-amber-100 px-1">npm run dev</code>).
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy || missing.length > 0}
            onClick={async () => {
              try {
                setBusy(true);
                setStatus("Abriendo Google…");
                await signInGoogle();
              } catch (e: any) {
                setStatus(
                  e?.message ??
                    "No se pudo iniciar sesión con Google (revisa: provider Google habilitado + dominios autorizados)."
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Continuar con Google
          </button>

          <div className="mt-2 border-t pt-4">
            <label className="text-xs font-medium text-zinc-700">Email (link mágico)</label>
            <div className="mt-2 flex gap-2">
              <input
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
                inputMode="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="h-11 shrink-0 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 disabled:opacity-50"
                disabled={busy || !email || missing.length > 0}
                onClick={async () => {
                  try {
                    setBusy(true);
                    setStatus("Enviando link…");
                    await sendMagicLink(email.trim(), `${baseUrl}/login`);
                    setStatus("Listo: revisa tu email para abrir el link.");
                  } catch (e: any) {
                    setStatus(e?.message ?? "No se pudo enviar el link.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Enviar
              </button>
            </div>
          </div>

          {status ? (
            <p className="mt-2 text-sm text-zinc-700">
              {status}
            </p>
          ) : null}

          {bootstrapError ? (
            <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
              <div className="font-semibold">No se pudo preparar el workspace</div>
              <div className="mt-1 text-zinc-700">{bootstrapError}</div>
            <div className="mt-2 text-xs text-zinc-500">
              Si pone “Failed to authenticate / functions”, necesitas ejecutar <code className="rounded bg-white px-1">npx firebase login</code> y desplegar
              <code className="rounded bg-white px-1">functions</code>.
            </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="h-10 rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white"
                  onClick={async () => {
                    if (!user) return;
                    setBootstrapError("");
                    setStatus("Reintentando bootstrap…");
                    try {
                      await bootstrapWorkspace();
                      router.replace("/app");
                    } catch (e: any) {
                      const msg = e?.message ?? "Sigue fallando el bootstrap.";
                      setBootstrapError(msg);
                      setStatus(msg);
                    }
                  }}
                >
                  Reintentar
                </button>
                <Link className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 inline-flex items-center" href="/setup">
                  Revisar setup
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

