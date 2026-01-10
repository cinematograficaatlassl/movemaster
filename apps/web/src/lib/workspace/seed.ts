"use client";

export const DEMO_WORKSPACE_NAME = "Mudanza BCN → MX";

export const DEMO_SETTINGS = {
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
} as const;

export type SeedTask = {
  title: string;
  area: "ESPAÑA" | "ATLAS" | "MEXICO" | "DUBAI";
  description?: string;
  status?: string;
  category?: string;
  priority?: string;
  tags?: string[];
  cost?: { amount: number; currency: string };
  deposit?: { amount: number; currency: string };
  dependenciesTitles?: string[];
  checklist?: { text: string; done: boolean }[];
};

export const SEED_TASKS: SeedTask[] = [
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
    description:
      "Objetivo: tramitar el Certificado de Menaje de Casa para la mudanza internacional.\n\nNotas: coordinar con Consulado de México en Barcelona. Adjuntar inventario y documentación requerida.",
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
    description:
      "Apostillar documentos españoles necesarios para trámites en México.\n\nEvitar duplicados: lista exacta de documentos, copias, plazos.",
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
    description:
      "CRÍTICO: renovar e.firma en SAT. Requiere presencia física en México.\n\nContexto: residencia permanente en México ya existente y CURP ya existente. No es trámite turístico.\n\nDependencias: desbloquea ALTA HACIENDA y revisar SAT DEUDA.",
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
    description:
      "Definir estrategia fiscal y gestionar baja consular si corresponde.\n\nObjetivo: minimizar riesgos y asegurar cumplimiento (no asumir estatus de turista).",
    checklist: [
      { text: "Revisar situación fiscal actual (ES/MX) y objetivos", done: false },
      { text: "Definir plan con asesor/a (acciones y calendario)", done: false },
      { text: "Ejecutar baja consular si aplica", done: false },
    ],
  },
];

