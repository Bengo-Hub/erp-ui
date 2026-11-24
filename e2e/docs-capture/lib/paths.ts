import path from "node:path";

// erp-ui/e2e/docs-capture/lib -> the Codevertex root is 5 levels up. Screenshots go straight into
// the shared-docs ERP guide; the shared-docs ERP brochure reads the same files.
const ROOT = path.resolve(__dirname, "../../../../..");

export const ASSETS_DIR = path.join(ROOT, "shared-docs/docs/user-guide/erp/assets");

export function assetPath(...segments: string[]) {
  return path.join(ASSETS_DIR, ...segments);
}

// Saved SSO session from auth.setup.ts; never git-tracked.
export const AUTH_FILE = path.resolve(__dirname, "../.auth/demo-tenant.json");
