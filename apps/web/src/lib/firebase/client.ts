import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseConfigStatus } from "@/lib/firebase/runtimeConfig";

const isBrowser = typeof window !== "undefined";

const status = getFirebaseConfigStatus();
export const firebaseConfigSource = status.source;
export const firebaseConfigMissing = isBrowser && status.source === "none" ? status.missingEnvKeys : [];

function initBrowserApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;
  if (!status.config) throw new Error("Firebase config missing");
  return initializeApp({
    ...status.config,
  });
}

export const firebaseApp: FirebaseApp | null =
  isBrowser && status.source !== "none" ? initBrowserApp() : null;
export const auth: Auth | null = isBrowser && firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = isBrowser && firebaseApp ? getFirestore(firebaseApp) : null;
export const storage: FirebaseStorage | null = isBrowser && firebaseApp ? getStorage(firebaseApp) : null;

