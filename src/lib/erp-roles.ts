/**
 * ERP-relevant role allowlist. The shared SSO/auth registry holds roles for ALL services
 * (POS: bar/barista/cashier/kitchen/waiter; logistics: driver/rider; ISP: isp_*; pharmacy:
 * pharmacist; …). Those belong to their owning services and must NOT be deleted from the shared
 * registry — but they should not appear in the ERP role-assignment UI either. This set scopes the
 * erp user-role picker to roles that actually map to ERP modules (mirrors cmd/seed's erp catalogue
 * + the generic platform roles).
 */
const ERP_ROLE_CODES = new Set([
  // erp service roles (cmd/seed)
  "erp_admin", "ceo", "cto", "ict_manager", "ict_officer",
  "hr_manager", "hr_assistant", "hr_viewer",
  "payroll_manager", "finance_manager", "operations_manager",
  "procurement_manager", "sales_manager", "secretary", "accountant",
  // generic platform roles (cross-cutting, not service-specific)
  "admin", "manager", "viewer", "staff", "superuser", "superusers",
]);

/** Normalise a role id/name to its code form: "Hr Manager" -> "hr_manager". */
export function normalizeRole(s: string): string {
  return (s || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** True when the role id or name maps to an ERP module (or is a generic platform role). */
export function isErpRole(idOrName: string): boolean {
  return ERP_ROLE_CODES.has(normalizeRole(idOrName));
}
