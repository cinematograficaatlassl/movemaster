import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const EMAIL_LINK_KEY = "mm_emailLinkSignInEmail";

export async function signInGoogle() {
  if (!auth) throw new Error("Firebase Auth no está inicializado (env missing).");
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  // iPhone/iPad: redirect suele ser más fiable. Desktop: popup suele evitar loops.
  if (isIOS) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

export async function completeGoogleRedirect() {
  if (!auth) return null;
  // Si venimos de un redirect, aquí salen los errores "silenciosos" (redirect_uri_mismatch, etc.)
  return await getRedirectResult(auth);
}

export async function ensureAuthPersistence() {
  if (!auth) return;
  await setPersistence(auth, browserLocalPersistence);
}

export async function sendMagicLink(email: string, url: string) {
  if (!auth) throw new Error("Firebase Auth no está inicializado (env missing).");
  await sendSignInLinkToEmail(auth, email, {
    url,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_LINK_KEY, email);
}

export function isEmailLink(url: string) {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, url);
}

export async function completeMagicLink(url: string) {
  if (!auth) throw new Error("Firebase Auth no está inicializado (env missing).");
  const email = window.localStorage.getItem(EMAIL_LINK_KEY);
  if (!email) throw new Error("Falta email guardado para completar el login.");
  await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(EMAIL_LINK_KEY);
}

export async function logout() {
  if (!auth) return;
  await signOut(auth);
}

