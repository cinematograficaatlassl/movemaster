"use client";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  addDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type TaskDoc = any;
export type CommentDoc = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: any;
  mentions: string[];
};

export function subscribeTask(workspaceId: string, taskId: string, cb: (task: TaskDoc | null) => void): Unsubscribe {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as any) : null));
}

export function subscribeComments(
  workspaceId: string,
  taskId: string,
  cb: (comments: CommentDoc[]) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = collection(db, "workspaces", workspaceId, "tasks", taskId, "comments");
  return onSnapshot(ref, (snap) => {
    const comments = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a: any, b: any) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)) as CommentDoc[];
    cb(comments);
  });
}

export async function updateTaskFields(workspaceId: string, taskId: string, patch: Record<string, any>) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp(), lastActivityAt: serverTimestamp() });
}

export async function toggleChecklistItem(workspaceId: string, taskId: string, index: number, done: boolean) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  // MVP: reescribir array completo (simple y suficiente)
  // El caller pasa el array actualizado via updateTaskFields; aquí no lo tenemos.
  await updateDoc(ref, { updatedAt: serverTimestamp(), lastActivityAt: serverTimestamp() });
}

export async function addComment(workspaceId: string, taskId: string, text: string, actorUid: string) {
  if (!db) throw new Error("Firestore no inicializado.");
  const mentions = Array.from(text.matchAll(/@([^\s]+)/g)).map((m) => m[1] ?? "").filter(Boolean);
  const ref = collection(db, "workspaces", workspaceId, "tasks", taskId, "comments");
  await addDoc(ref, {
    text,
    mentions,
    createdBy: actorUid,
    createdAt: serverTimestamp(),
  });

  // lastActivity
  const taskRef = doc(db, "workspaces", workspaceId, "tasks", taskId);
  await updateDoc(taskRef, { lastActivityAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function addAttachment(workspaceId: string, taskId: string, attachment: any) {
  if (!db) throw new Error("Firestore no inicializado.");
  const taskRef = doc(db, "workspaces", workspaceId, "tasks", taskId);
  await updateDoc(taskRef, {
    attachments: arrayUnion(attachment),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
}

