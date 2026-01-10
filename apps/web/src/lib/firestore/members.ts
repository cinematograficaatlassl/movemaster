"use client";

import { doc, onSnapshot, updateDoc, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type SnoozePrefs = {
  defaultDays: number;
  optionsDays: number[];
};

export type MemberDoc = {
  id: string;
  role: "Admin" | "Editor" | "Viewer";
  displayName?: string;
  email?: string;
  timezone?: string;
  notificationPrefs?: "push" | "email" | "both";
  snoozePrefs?: SnoozePrefs;
};

export function subscribeMyMemberDoc(
  workspaceId: string,
  uid: string,
  cb: (m: MemberDoc | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "members", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as any) } as any);
  }, onError);
}

export async function updateMySnoozePrefs(workspaceId: string, uid: string, snoozePrefs: SnoozePrefs) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "members", uid);
  await updateDoc(ref, { snoozePrefs, updatedAt: serverTimestamp() } as any);
}

