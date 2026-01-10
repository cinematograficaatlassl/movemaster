"use client";

import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type Task = {
  id: string;
  title: string;
  description: string;
  area: string;
  category: string;
  status: string;
  priority: string;
  assignees?: string[];
  dueDate: any;
  targetDate: any;
  snoozeUntil?: any;
  snoozedBy?: string;
  snoozedAt?: any;
  cost: { amount: number; currency: string } | null;
  deposit: { amount: number; currency: string } | null;
  paid: boolean;
  paidAt: any;
  tags: string[];
  checklist: { text: string; done: boolean }[];
  attachments: any[];
  dependencies: string[];
  updatedAt: any;
  createdAt: any;
};

export type TaskFilters = {
  area?: string;
  status?: string;
};

export function subscribeTasks(
  workspaceId: string,
  filters: TaskFilters,
  cb: (tasks: Task[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore no inicializado.");
  const base = collection(db, "workspaces", workspaceId, "tasks");
  const constraints: any[] = [];
  if (filters.area) constraints.push(where("area", "==", filters.area));
  if (filters.status) constraints.push(where("status", "==", filters.status));
  constraints.push(orderBy("updatedAt", "desc"));
  const q = query(base, ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Task[];
      cb(tasks);
    },
    onError
  );
}

export async function setTaskStatus(workspaceId: string, taskId: string, status: string, actorUid: string) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    ...(status === "Done"
      ? { completedAt: serverTimestamp(), completedBy: actorUid }
      : { completedAt: null, completedBy: null }),
  } as any);
}

export async function snoozeTask(workspaceId: string, taskId: string, days: number, actorUid: string) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await updateDoc(ref, {
    status: "Waiting",
    snoozeUntil: until,
    snoozedBy: actorUid,
    snoozedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  } as any);
}

export type NewTaskInput = Partial<Pick<Task, "title" | "description" | "area" | "category" | "status" | "priority">> & {
  cost?: { amount: number; currency: string } | null;
  deposit?: { amount: number; currency: string } | null;
};

export async function createTask(workspaceId: string, actorUid: string, input: NewTaskInput) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = collection(db, "workspaces", workspaceId, "tasks");
  const now = serverTimestamp();
  const docRef = await addDoc(ref, {
    title: input.title?.trim() || "Nueva tarea",
    description: input.description ?? "",
    area: input.area ?? "ESPAÑA",
    category: input.category ?? "Otros",
    status: input.status ?? "To do",
    priority: input.priority ?? "P2",
    assignees: [],
    dueDate: null,
    targetDate: null,
    cost: input.cost ?? null,
    deposit: input.deposit ?? null,
    paid: false,
    paidAt: null,
    tags: [],
    checklist: [],
    attachments: [],
    dependencies: [],
    rawText: "",
    remindersSent: {},
    createdBy: actorUid,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    completedBy: null,
    lastActivityAt: now,
  } as any);
  return docRef.id;
}

export async function deleteTask(workspaceId: string, taskId: string) {
  if (!db) throw new Error("Firestore no inicializado.");
  const ref = doc(db, "workspaces", workspaceId, "tasks", taskId);
  await deleteDoc(ref);
}
