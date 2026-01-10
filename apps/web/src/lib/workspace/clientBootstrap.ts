"use client";

import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEMO_SETTINGS, DEMO_WORKSPACE_NAME, SEED_TASKS } from "@/lib/workspace/seed";

export async function clientBootstrapWorkspace(uid: string, email: string, displayName: string) {
  if (!db) throw new Error("Firestore no inicializado.");

  // Workspace determinista para evitar duplicados (y sin queries globales que requieren permisos)
  const wsId = `ws_${uid}`;
  const wsRef = doc(db, "workspaces", wsId);

  // Si ya existe, devolvemos (lectura permitida al owner)
  let existing;
  try {
    existing = await getDoc(wsRef);
  } catch (e: any) {
    const code = e?.code ?? e?.name ?? "unknown";
    throw new Error(`BOOTSTRAP_STEP_read_workspace failed (${code}): ${e?.message ?? e}`);
  }
  if (existing.exists()) {
    const data = existing.data() as any;
    return { workspaceId: wsId, workspaceName: data?.name ?? DEMO_WORKSPACE_NAME };
  }

  // Paso 1: crear workspace (sin depender de member aún)
  try {
    await setDoc(wsRef, {
      name: DEMO_WORKSPACE_NAME,
      ownerUid: uid,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: DEMO_SETTINGS,
    });
  } catch (e: any) {
    const code = e?.code ?? e?.name ?? "unknown";
    throw new Error(`BOOTSTRAP_STEP_create_workspace failed (${code}): ${e?.message ?? e}`);
  }

  // Paso 2: crear member (Admin) - necesario antes de poder crear tasks/lists/templates por rules
  try {
    await setDoc(doc(db, "workspaces", wsId, "members", uid), {
      role: "Admin",
      displayName,
      email,
      timezone: "Europe/Madrid",
      notificationPrefs: "both",
      snoozePrefs: { defaultDays: 2, optionsDays: [1, 2, 7, 14] },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e: any) {
    const code = e?.code ?? e?.name ?? "unknown";
    throw new Error(`BOOTSTRAP_STEP_create_member failed (${code}): ${e?.message ?? e}`);
  }

  // Paso 3: seed de tasks/lists/templates en batch (ahora sí pasará canWriteTasks)
  const batch = writeBatch(db);

  const byTitleToId: Record<string, string> = {};
  for (const t of SEED_TASKS) {
    byTitleToId[t.title] = doc(collection(db, "workspaces", wsId, "tasks")).id;
  }

  for (const t of SEED_TASKS) {
    const taskId = byTitleToId[t.title]!;
    const depIds =
      t.dependenciesTitles?.map((title) => byTitleToId[title]).filter(Boolean) ?? [];
    batch.set(doc(db, "workspaces", wsId, "tasks", taskId), {
      title: t.title,
      description: t.description ?? "",
      area: t.area,
      category: t.category ?? "Otros",
      status: t.status ?? "To do",
      priority: t.priority ?? "P2",
      assignees: [],
      dueDate: null,
      targetDate: null,
      cost: t.cost ?? null,
      deposit: t.deposit ?? null,
      paid: false,
      paidAt: null,
      tags: t.tags ?? [],
      checklist: t.checklist ?? [],
      attachments: [],
      dependencies: depIds,
      rawText: "",
      remindersSent: {},
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
      completedBy: null,
      lastActivityAt: serverTimestamp(),
    });
  }

  // Lista custom seed: VENDER
  batch.set(doc(collection(db, "workspaces", wsId, "lists")), {
    name: "VENDER",
    columns: ["VENDER", "MONTANYA", "TIBIDABO", "ATLAS"],
    rows: [],
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Templates seed (MVP)
  batch.set(doc(collection(db, "workspaces", wsId, "templates")), {
    name: "Mudanza a México",
    key: "move_to_mexico",
    createdAt: serverTimestamp(),
    createdBy: uid,
    steps: [
      { id: "confirm-areas", type: "confirm", title: "Confirmar áreas y responsables" },
      { id: "apply", type: "apply", title: "Crear tareas" },
    ],
    taskTitles: [
      "Certificado de Menaje de Casa (Consulado MX BCN)",
      "Apostilla de documentos españoles",
      "Renovar e.firma (SAT) — requiere viaje a México",
      "ALTA HACIENDA?",
      "ABRIR BANCO MATIAS",
      "COLEGIO?",
      "VUELOS",
      "Estrategia fiscal + Baja Consular",
    ],
  });

  batch.set(doc(collection(db, "workspaces", wsId, "templates")), {
    name: "Cerrar piso en España (BCN)",
    key: "close_flat_bcn",
    createdAt: serverTimestamp(),
    createdBy: uid,
    steps: [
      { id: "address", type: "input", title: "Dirección del piso" },
      { id: "handover", type: "date", title: "Fecha entrega" },
      { id: "toggles", type: "toggle", title: "Opciones (vender casa / tasadoras)" },
      { id: "apply", type: "apply", title: "Crear tareas" },
    ],
    taskTitles: [
      "AVISO TONI Enero-Abril entregamos del depto — depósito 6140 EUR",
      "ARIEL pintura depto en abril — coste 1000 EUR",
      "Mudanza Muntanya JUAN cuando? — 300 EUR",
      "Mudanza despacho JUAN — 150 EUR",
      "BAJA PADRON? Cuando?",
      "Pagar Jaume — “8k partido en 2 primera y última semana de enero”",
      "Tasadora casa ANA ASAP — “Comisiones? Terrenos”",
      "Tasadora casa OTRA ASAP — “Comisiones? Terrenos”",
      "AMEX",
    ],
  });

  try {
    await batch.commit();
  } catch (e: any) {
    const code = e?.code ?? e?.name ?? "unknown";
    throw new Error(`BOOTSTRAP_STEP_seed_batch failed (${code}): ${e?.message ?? e}`);
  }
  return { workspaceId: wsId, workspaceName: DEMO_WORKSPACE_NAME };
}

