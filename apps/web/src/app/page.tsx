"use client";

import Link from "next/link";
import { firebaseConfigMissing } from "@/lib/firebase/client";

export default function Home() {
  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">MoveMaster</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Mudanza internacional colaborativa (familia, tiempo real, PWA).
        </p>
        {firebaseConfigMissing.length ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-semibold">Falta configurar Firebase</div>
            <div className="mt-1 text-amber-900/80">
              Puedes configurarlo desde la app:
            </div>
            <div className="mt-3">
              <Link
                href="/setup"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white"
              >
                Abrir setup
              </Link>
            </div>
            <div className="mt-3 text-xs text-amber-900/80">Faltan envs: {firebaseConfigMissing.join(", ")}</div>
          </div>
        ) : null}
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
