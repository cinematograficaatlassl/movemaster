import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // En monorepo, fijamos la raíz al repo para que Turbopack resuelva deps hoisted en node_modules.
    root: repoRoot,
  },
};

export default nextConfig;

