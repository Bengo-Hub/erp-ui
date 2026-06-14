import { test, expect } from "@playwright/test";

test("healthz endpoint returns healthy", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("healthy");
});

test("unauthenticated tenant route redirects to login", async ({ page }) => {
  await page.goto("/codevertex");
  await expect(page).toHaveURL(/\/codevertex\/auth\/login/);
});
