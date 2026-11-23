"use client";

import { useAppPermissions } from "@/hooks/use-app-permissions";

/**
 * Which dashboard sections a person sees, from the dotted codes erp-api enforces.
 * HR: attendance and people figures. Security: devices, punches and door events.
 * Management: payroll cost and piece earnings. Admin-tier roles see everything.
 */
export function useDashboardRoles() {
  const { hasAnyPermission, hasPermission } = useAppPermissions();
  const hr = hasAnyPermission(["hrm.attendance.view", "hrm.employee.view"]);
  const security = hasPermission("hrm.attendance.manage");
  const management = hasAnyPermission(["hrm.payroll.view", "reports.view"]);
  // Both analytics reads sit behind reports.view on erp-api.
  const analytics = hasPermission("reports.view");
  return { hr, security, management, analytics };
}
