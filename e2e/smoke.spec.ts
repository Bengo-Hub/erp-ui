import { test, expect } from "@playwright/test";

/**
 * Headless smoke suite. No live backend / SSO session is assumed, so the
 * behaviour under test is the auth gate: every protected surface must resolve
 * (no 404/500) and redirect an unauthenticated visitor to the tenant login.
 * This exercises routing, the AuthProvider guard, and the login shell.
 */

const ORG = "codevertex";
const LOGIN_RE = new RegExp(`/${ORG}/auth/login`);

test.describe("auth-gated tenant surfaces redirect to SSO login", () => {
  for (const { name, path } of [
    { name: "dashboard", path: `/${ORG}` },
    { name: "employee list", path: `/${ORG}/hrm/employees` },
    { name: "payroll process (run gating)", path: `/${ORG}/payroll/process` },
    { name: "payslips", path: `/${ORG}/payroll/payslips` },
    { name: "NSSF report", path: `/${ORG}/reports/nssf` },
  ]) {
    test(`${name} redirects unauthenticated users to login`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      // Route resolves without a server error.
      expect(res?.status() ?? 200).toBeLessThan(400);
      // Client-side guard redirects once zustand persist hydrates + JS settles.
      await expect(page).toHaveURL(LOGIN_RE, { timeout: 20_000 });
    });
  }
});

test("login page renders the SSO sign-in control", async ({ page }) => {
  await page.goto(`/${ORG}/auth/login`);
  await expect(page.getByRole("button", { name: /sign in with sso/i })).toBeVisible();
});

test("login preserves the intended destination for post-auth return", async ({ page }) => {
  await page.goto(`/${ORG}/payroll/process`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(LOGIN_RE, { timeout: 20_000 });
  const returnTo = await page.evaluate(() => sessionStorage.getItem("sso_return_to"));
  expect(returnTo).toContain("/payroll/process");
});

test("healthz endpoint reports healthy", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).status).toBe("healthy");
});
