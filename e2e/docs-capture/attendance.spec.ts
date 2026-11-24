import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { orgUrl } from "./lib/auth";
import { assetPath } from "./lib/paths";

// Screenshots for shared-docs docs/user-guide/erp/ and the ERP time and attendance pack.
// Read-only navigation over the demo tenant's seeded data; nothing is submitted. Run with
// the setup project first:
//   E2E_BASE_URL=https://erp.codevertexafrica.com npx playwright test \
//     --project=docs-capture-setup --project=docs-capture e2e/docs-capture/attendance.spec.ts

const SHOTS: { name: string; path: string; heading?: RegExp; fullPage?: boolean }[] = [
  { name: "exec-dashboard", path: "/" },
  { name: "hr-dashboard", path: "/hrm" },
  { name: "devices", path: "/hrm/attendance/devices" },
  { name: "punches", path: "/hrm/attendance/punches" },
  { name: "access-log", path: "/hrm/attendance/access-log" },
  { name: "work-sites", path: "/hrm/attendance/work-sites" },
  { name: "attendance-settings", path: "/hrm/attendance/settings" },
  { name: "corrections", path: "/hrm/attendance/regularisations" },
  { name: "overtime", path: "/hrm/attendance/overtime-requests" },
  { name: "shift-planner", path: "/hrm/attendance/shift-planner" },
  { name: "attendance-records", path: "/hrm/attendance/records" },
  { name: "piece-rates", path: "/settings/payroll/piece-rates" },
  { name: "piece-output", path: "/payroll/piece-output" },
  { name: "reports-hub", path: "/reports" },
  { name: "report-absenteeism", path: "/reports/absenteeism" },
  { name: "report-access-log", path: "/reports/access-log" },
  { name: "report-attendance-summary", path: "/reports/attendance-summary" },
  { name: "report-piece-output", path: "/reports/piece-output" },
];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  // Skeletons and lazy charts finish after network idle.
  await page.waitForTimeout(1500);
}

async function save(page: Page, name: string, fullPage = false) {
  const png = assetPath(`${name}.png`);
  fs.mkdirSync(path.dirname(png), { recursive: true });
  await page.screenshot({ path: png, fullPage });
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  for (const s of SHOTS) {
    test(s.name, async ({ page }) => {
      await page.goto(orgUrl(s.path));
      await expect(page.locator("main")).toBeVisible({ timeout: 20_000 });
      await settle(page);
      await save(page, s.name, s.fullPage);
    });
  }
});

test.describe("phone", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    geolocation: { latitude: -0.0918, longitude: 34.7681, accuracy: 12 },
    permissions: ["geolocation"],
  });
  test("ess-clock-in", async ({ page }) => {
    await page.goto(orgUrl("/ess"));
    await expect(page.locator("main")).toBeVisible({ timeout: 20_000 });
    await settle(page);
    await save(page, "ess-clock-in");
  });
});
