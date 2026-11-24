import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

import { orgUrl } from "./lib/auth";

// Data-gap audit: opens every list page with seeded demo data and records, per table column, how
// many cells render the empty placeholder. A column that is empty on every row usually means the
// UI reads a field the API does not return. Writes test-results/empty-columns.json.
const ROUTES = [
  "hrm/employees", "hrm/contracts", "hrm/leave/requests", "hrm/leave/balances", "hrm/leave/entitlement", "hrm/leave/logs",
  "hrm/leave/types", "hrm/attendance/records", "hrm/attendance/timesheets", "hrm/attendance/work-shifts",
  "hrm/attendance/rosters", "hrm/attendance/rules", "hrm/attendance/regularisations", "hrm/attendance/overtime-requests",
  "hrm/attendance/devices", "hrm/attendance/punches", "hrm/attendance/access-log", "hrm/attendance/work-sites",
  "hrm/appraisals", "hrm/appraisals/cycles", "hrm/appraisals/goals", "hrm/appraisals/questions", "hrm/appraisals/templates",
  "hrm/training/courses", "hrm/training/enrollments", "hrm/training/evaluations", "hrm/recruitment/jobs",
  "hrm/recruitment/applications", "hrm/recruitment/candidates", "payroll/payslips", "payroll/advances", "payroll/claims",
  "payroll/piece-output", "settings/payroll/piece-rates", "settings/hrm/departments", "settings/hrm/job-titles",
];
const EMPTY = new Set(["—", "-", "", "N/A", "n/a", "#undefined", "NaN", "Invalid Date", "KES NaN"]);

test("empty column audit", async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const report: Record<string, { rows: number; empty: Record<string, number> }> = {};
  for (const r of ROUTES) {
    await page.goto(orgUrl(`/${r}`));
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1200);
    report[r] = await page.evaluate((empty) => {
      const table = document.querySelector("main table");
      if (!table) return { rows: 0, empty: {} };
      const heads = [...table.querySelectorAll("thead th")].map((th) => (th.textContent || "").trim());
      const rows = [...table.querySelectorAll("tbody tr")].filter((tr) => tr.querySelectorAll("td").length > 1);
      const counts: Record<string, number> = {};
      for (const tr of rows) {
        [...tr.querySelectorAll("td")].forEach((td, i) => {
          const t = (td.textContent || "").trim();
          if (empty.includes(t) || /NaN|undefined/.test(t)) counts[heads[i] || `col${i}`] = (counts[heads[i] || `col${i}`] || 0) + 1;
        });
      }
      return { rows: rows.length, empty: counts };
    }, [...EMPTY]);
  }
  const out = path.resolve(__dirname, "../../test-results/empty-columns.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
});
