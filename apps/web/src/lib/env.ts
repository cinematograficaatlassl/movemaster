export function mustGetEnv(name: string) {
  const v = process.env[name];
  // Durante build/prerender (SSR) no queremos romper el build por envs client-only.
  // Fallamos en el navegador (runtime) si faltan.
  if (!v) {
    if (typeof window === "undefined") return "";
    throw new Error(`Falta variable de entorno: ${name}`);
  }
  return v;
}

