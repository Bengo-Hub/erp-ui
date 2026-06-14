// Starts the Next.js standalone production server for Playwright smoke runs.
// `next start` is incompatible with output:"standalone", so we run the bundled
// server.js after copying static assets next to it (mirrors the Dockerfile).
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");

if (!existsSync(join(standalone, "server.js"))) {
  console.error("Standalone build missing — run `pnpm build` first.");
  process.exit(1);
}

// Place static + public assets where the standalone server expects them.
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
}

const child = spawn(process.execPath, [join(standalone, "server.js")], {
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT || "3000", HOSTNAME: "127.0.0.1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
