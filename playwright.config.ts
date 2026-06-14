import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Auto-start the production standalone server for headless smoke runs unless an
  // external URL is supplied. (`next start` is incompatible with
  // output: "standalone", so we boot the bundled server.js — see the script.)
  // Requires a prior `pnpm build`.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "node e2e/start-standalone.mjs",
        url: "http://localhost:3000/healthz",
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
