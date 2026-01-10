"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/functions";
import { clientBootstrapWorkspace } from "@/lib/workspace/clientBootstrap";
import { auth } from "@/lib/firebase/client";

const ACTIVE_WS_KEY = "mm_activeWorkspaceId";

export type BootstrapResult = { workspaceId: string; workspaceName: string };

export async function bootstrapWorkspace(): Promise<BootstrapResult> {
  const user = auth?.currentUser;
  if (!user?.uid) throw new Error("No autenticado. Vuelve a iniciar sesión.");

  // Intento 1: Cloud Functions (si existen).
  if (functions) {
    const fn = httpsCallable(functions, "bootstrapWorkspace");
    try {
      const res = await fn();
      const data = res.data as BootstrapResult;
      window.localStorage.setItem(ACTIVE_WS_KEY, data.workspaceId);
      return data;
    } catch (e: any) {
      const code = e?.code ?? "";
      // Si no hay Functions (Spark plan / no deploy), hacemos fallback a bootstrap cliente.
      if (code === "functions/not-found" || code === "functions/internal" || code === "internal") {
        // fallthrough
      } else if (code === "functions/unauthenticated") {
        throw new Error("No autenticado. Vuelve a iniciar sesión.");
      } else {
        // Si viene un error útil, lo mostramos igual.
        // Luego probamos fallback.
      }
    }
  }

  // Fallback: bootstrap cliente (no requiere Blaze)
  const email = user.email ?? "unknown";
  const displayName = user.displayName ?? "";
  const data = await clientBootstrapWorkspace(user.uid, email, displayName);
  window.localStorage.setItem(ACTIVE_WS_KEY, data.workspaceId);
  return data;
}

export function getActiveWorkspaceId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_WS_KEY);
}

