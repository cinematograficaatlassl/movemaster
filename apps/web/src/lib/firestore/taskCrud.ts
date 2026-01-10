"use client";

import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task } from "@/lib/firestore/tasks";

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

