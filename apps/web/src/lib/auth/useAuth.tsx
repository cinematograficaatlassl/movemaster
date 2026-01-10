"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import React from "react";
import { auth } from "@/lib/firebase/client";
import { ensureAuthPersistence } from "@/lib/auth/actions";

type AuthState = { user: User | null; loading: boolean };

const AuthContext = React.createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ user: null, loading: true });

  React.useEffect(() => {
    if (!auth) {
      setState({ user: null, loading: false });
      return;
    }
    // Forzar persistencia estable (Safari/private puede fallar; si falla, lo veremos en UI).
    ensureAuthPersistence().catch(() => {});
    const unsub = onAuthStateChanged(auth, (user) => setState({ user, loading: false }));
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}

