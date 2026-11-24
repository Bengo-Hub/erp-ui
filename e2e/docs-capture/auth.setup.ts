import { test as setup } from "@playwright/test";

import { ssoLogin } from "./lib/auth";
import { AUTH_FILE } from "./lib/paths";

// Signs in once per run and saves the session; every capture spec reuses it via storageState.
setup("authenticate via SSO", async ({ page }) => {
  setup.setTimeout(120_000);
  await ssoLogin(page);
  await page.context().storageState({ path: AUTH_FILE });
});
