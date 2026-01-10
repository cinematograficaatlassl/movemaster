"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapWorkspace = exports.health = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const adminDb = (0, firestore_1.getFirestore)();
// MVP placeholder: la lógica real (seed, notificaciones, scheduler) se añade en los siguientes pasos.
exports.health = (0, https_1.onRequest)((_req, res) => {
    res.status(200).json({ ok: true, service: "movemaster-functions" });
});
exports.bootstrapWorkspace = (0, https_1.onCall)(async (req) => {
    try {
        if (!req.auth?.uid || !req.auth.token?.email) {
            throw new https_1.HttpsError("unauthenticated", "AUTH_REQUIRED");
        }
        const uid = req.auth.uid;
        const email = req.auth.token.email;
        const displayName = req.auth.token.name ?? "";
        // MVP: si el usuario ya tiene workspaceId guardado en su member doc, lo reutilizamos.
        // Como no tenemos colección global de memberships, buscamos por campo "ownerUid" en workspaces (que seteamos en seed).
        const existing = await adminDb
            .collection("workspaces")
            .where("ownerUid", "==", uid)
            .limit(1)
            .get();
        if (!existing.empty) {
            const doc = existing.docs[0];
            return { workspaceId: doc.id, workspaceName: doc.data().name ?? "Workspace" };
        }
        const wsRef = adminDb.collection("workspaces").doc();
        const wsId = wsRef.id;
        const now = firestore_1.FieldValue.serverTimestamp();
        const settings = {
            areas: ["ESPAÑA", "ATLAS", "MEXICO", "DUBAI"],
            categories: [
                "Casa",
                "Mudanza",
                "Documentos",
                "Hacienda/SAT",
                "Bancos",
                "Colegio",
                "Visas",
                "Vuelos",
                "Legal/Fiscal",
                "Otros",
            ],
            statuses: ["To do", "In progress", "Waiting", "Blocked", "Done"],
            priorities: ["P0", "P1", "P2", "P3"],
            currencies: ["EUR", "MXN", "USD"],
            customFields: [],
            views: [],
        };
        const wsName = "Mudanza BCN → MX";
        const batch = adminDb.batch();
        batch.set(wsRef, {
            name: wsName,
            ownerUid: uid,
            createdBy: uid,
            createdAt: now,
            updatedAt: now,
            settings,
        });
        batch.set(wsRef.collection("members").doc(uid), {
            role: "Admin",
            displayName,
            email,
            timezone: "Europe/Madrid",
            notificationPrefs: "both",
            snoozePrefs: {
                defaultDays: 2,
                optionsDays: [1, 2, 7, 14],
            },
            createdAt: now,
            updatedAt: now,
        });
        const seedTasks = [
            { area: "ESPAÑA", title: "BAJA PADRON? Cuando?" },
            { area: "ESPAÑA", title: "HORITZO FIN (MAYO) — “Primera semana enero”" },
            { area: "ESPAÑA", title: "AVISO TONI Enero-Abril entregamos del depto — depósito 6140 EUR", deposit: { amount: 6140, currency: "EUR" } },
            { area: "ESPAÑA", title: "ARIEL pintura depto en abril — coste 1000 EUR", cost: { amount: 1000, currency: "EUR" } },
            { area: "ESPAÑA", title: "Mudanza Int’l", category: "Mudanza" },
            { area: "ESPAÑA", title: "Mudanza Muntanya JUAN cuando? — 300 EUR", cost: { amount: 300, currency: "EUR" }, category: "Mudanza" },
            { area: "ESPAÑA", title: "Mudanza despacho JUAN — 150 EUR", cost: { amount: 150, currency: "EUR" }, category: "Mudanza" },
            { area: "ESPAÑA", title: "Xevi preguntar lo de lo estructural para bajar beneficio" },
            { area: "ESPAÑA", title: "Pagar Jaume — “8k partido en 2 primera y última semana de enero”", cost: { amount: 8000, currency: "EUR" } },
            { area: "ESPAÑA", title: "Tasadora casa ANA ASAP — “Comisiones? Terrenos”" },
            { area: "ESPAÑA", title: "Tasadora casa OTRA ASAP — “Comisiones? Terrenos”" },
            { area: "ESPAÑA", title: "AMEX", category: "Bancos" },
            { area: "ATLAS", title: "BAJA HACIENDA Cuando?", category: "Hacienda/SAT" },
            { area: "ATLAS", title: "Arval BAJA COCHE Cuando? — “Averiguar penalización 30%”" },
            { area: "ATLAS", title: "Hablar con Gemma despacho — depósito 3200 EUR", deposit: { amount: 3200, currency: "EUR" } },
            { area: "ATLAS", title: "AGUA — inma@nictonplus.com" },
            { area: "MEXICO", title: "CIUDAD?" },
            { area: "MEXICO", title: "COLEGIO?", category: "Colegio" },
            { area: "MEXICO", title: "ALTA HACIENDA?", category: "Hacienda/SAT", dependenciesTitles: ["Renovar e.firma (SAT) — requiere viaje a México"] },
            { area: "MEXICO", title: "ABRIR BANCO MATIAS", category: "Bancos" },
            { area: "MEXICO", title: "SAT MEXICO DEUDA?", category: "Hacienda/SAT", dependenciesTitles: ["Renovar e.firma (SAT) — requiere viaje a México"] },
            { area: "MEXICO", title: "VUELOS", category: "Vuelos" },
            { area: "DUBAI", title: "GOLDEN VISA APPLICATION — coste 3000 EUR — “primera semana enero”", cost: { amount: 3000, currency: "EUR" }, category: "Visas", priority: "P1" },
            // Legales críticas
            {
                area: "MEXICO",
                title: "Certificado de Menaje de Casa (Consulado MX BCN)",
                category: "Documentos",
                priority: "P1",
                tags: ["legal", "mudanza", "menaje"],
                description: "Objetivo: tramitar el Certificado de Menaje de Casa para la mudanza internacional.\n\nNotas: coordinar con Consulado de México en Barcelona. Adjuntar inventario y documentación requerida.",
                checklist: [
                    { text: "Confirmar requisitos actuales del Consulado MX BCN", done: false },
                    { text: "Preparar inventario (menaje) y documentación soporte", done: false },
                    { text: "Solicitar cita / trámite", done: false },
                ],
            },
            {
                area: "ESPAÑA",
                title: "Apostilla de documentos españoles",
                category: "Documentos",
                priority: "P1",
                tags: ["legal", "apostilla"],
                description: "Apostillar documentos españoles necesarios para trámites en México.\n\nEvitar duplicados: lista exacta de documentos, copias, plazos.",
                checklist: [
                    { text: "Listar documentos a apostillar (actas, certificados, etc.)", done: false },
                    { text: "Identificar organismo/gestoría y tiempos", done: false },
                    { text: "Entregar/recoger apostillas", done: false },
                ],
            },
            {
                area: "MEXICO",
                title: "Renovar e.firma (SAT) — requiere viaje a México",
                category: "Hacienda/SAT",
                priority: "P0",
                tags: ["sat", "viaje", "critico"],
                description: "CRÍTICO: renovar e.firma en SAT. Requiere presencia física en México.\n\nContexto: residencia permanente en México ya existente y CURP ya existente. No es trámite turístico.\n\nDependencias: desbloquea ALTA HACIENDA y revisar SAT DEUDA.",
                checklist: [
                    { text: "Confirmar vigencia y requisitos de renovación", done: false },
                    { text: "Agendar cita SAT (si aplica) / plan de visita", done: false },
                    { text: "Documentos necesarios listos (identificación, CURP, etc.)", done: false },
                    { text: "Renovación completada y respaldos guardados", done: false },
                ],
            },
            {
                area: "MEXICO",
                title: "Estrategia fiscal + Baja Consular",
                category: "Legal/Fiscal",
                priority: "P1",
                tags: ["fiscal", "legal"],
                description: "Definir estrategia fiscal y gestionar baja consular si corresponde.\n\nObjetivo: minimizar riesgos y asegurar cumplimiento (no asumir estatus de turista).",
                checklist: [
                    { text: "Revisar situación fiscal actual (ES/MX) y objetivos", done: false },
                    { text: "Definir plan con asesor/a (acciones y calendario)", done: false },
                    { text: "Ejecutar baja consular si aplica", done: false },
                ],
            },
        ];
        const byTitleToRef = {};
        for (const t of seedTasks) {
            const taskRef = wsRef.collection("tasks").doc();
            byTitleToRef[t.title] = taskRef;
        }
        for (const t of seedTasks) {
            const taskRef = byTitleToRef[t.title];
            const deps = t.dependenciesTitles?.map((title) => {
                const ref = byTitleToRef[title];
                return ref ? ref.id : null;
            }).filter(Boolean) ?? [];
            batch.set(taskRef, {
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
                dependencies: deps,
                rawText: "",
                remindersSent: {},
                createdBy: uid,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                completedBy: null,
                lastActivityAt: now,
            });
        }
        // Lista custom seed: VENDER
        batch.set(wsRef.collection("lists").doc(), {
            name: "VENDER",
            columns: ["VENDER", "MONTANYA", "TIBIDABO", "ATLAS"],
            rows: [],
            createdBy: uid,
            createdAt: now,
            updatedAt: now,
        });
        // Templates seed (definición MVP; el wizard se implementa en UI luego)
        batch.set(wsRef.collection("templates").doc(), {
            name: "Mudanza a México",
            key: "move_to_mexico",
            createdAt: now,
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
        batch.set(wsRef.collection("templates").doc(), {
            name: "Cerrar piso en España (BCN)",
            key: "close_flat_bcn",
            createdAt: now,
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
        await batch.commit();
        return { workspaceId: wsId, workspaceName: wsName };
    }
    catch (e) {
        console.error("bootstrapWorkspace failed", {
            message: e?.message,
            code: e?.code,
            details: e?.details,
            stack: e?.stack,
        });
        // Si ya es HttpsError, lo respetamos
        if (e instanceof https_1.HttpsError)
            throw e;
        const msg = String(e?.message ?? "");
        if (msg.includes("Cloud Firestore") || msg.includes("firestore") || msg.includes("Firestore")) {
            throw new https_1.HttpsError("failed-precondition", "FIRESTORE_NOT_READY", "Activa Firestore en Firebase Console (Build → Firestore Database → Create database) y reintenta.");
        }
        throw new https_1.HttpsError("internal", "BOOTSTRAP_FAILED", msg || "Internal error");
    }
});
