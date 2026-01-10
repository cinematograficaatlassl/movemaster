import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase/client";

export const functions = firebaseApp ? getFunctions(firebaseApp) : (null as any);

// Emuladores (opcional): NEXT_PUBLIC_USE_EMULATORS=1
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_EMULATORS === "1" && functions) {
  try {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  } catch {
    // ignore double-connect
  }
}

