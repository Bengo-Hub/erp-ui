import type { Page } from "@playwright/test";

// Same flow as treasury-ui's docs-capture: start at the tenant so the SSO authorize redirect keeps
// return_to, sign in once, and let auth.setup.ts save the session for every spec.
// Credentials come from the environment only and are never written into this repo:
//   E2E_LOGIN_EMAIL, E2E_LOGIN_PASSWORD, E2E_ORG_SLUG (default codevertex-demo).
const ORG_SLUG = process.env.E2E_ORG_SLUG || "codevertex-demo";
export function orgUrl(path: string) {
  return `/${ORG_SLUG}${path}`;
}

const SSO_HOST = "accounts.codevertexafrica.com";

export async function ssoLogin(page: Page) {
  const email = process.env.E2E_LOGIN_EMAIL;
  const password = process.env.E2E_LOGIN_PASSWORD;
  if (!email || !password) throw new Error("Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD for docs-capture.");

  await page.goto(orgUrl("/"));
  const onSSO = await page
    .waitForURL(new RegExp(SSO_HOST), { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!onSSO) {
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    return;
  }
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

  const emailField = page.getByRole("textbox", { name: /email/i }).first();
  await emailField.waitFor({ state: "visible", timeout: 30_000 });
  await emailField.fill(email, { timeout: 15_000 });
  await page.getByRole("textbox", { name: /password/i }).fill(password, { timeout: 10_000 });
  // Exact match: /sign in/i would also match "Sign in with passkey".
  await page.getByRole("button", { name: /^sign in$/i }).click({ timeout: 10_000 });

  // A passkey setup nudge may appear before leaving /login; race it against the redirect.
  const maybeLater = page.getByRole("button", { name: "Maybe later" });
  const outcome = await Promise.race([
    maybeLater.waitFor({ state: "visible", timeout: 20_000 }).then(() => "nudge" as const),
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20_000 }).then(() => "redirected" as const),
  ]).catch(() => null);
  if (outcome === "nudge") {
    await maybeLater.click();
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20_000 }).catch(() => {});
  }

  await page
    .waitForURL((url) => /^(?:erp\.codevertexafrica\.com|localhost)$/.test(url.hostname), { timeout: 25_000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
}
