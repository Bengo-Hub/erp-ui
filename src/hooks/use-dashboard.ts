"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "@/lib/api/analytics";

/** HRM analytics dashboard (headcount/attendance/leave/payroll widgets). */
export function useHrmDashboard(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["dashboard", "hrm", params ?? {}],
    queryFn: () => analyticsApi.hrmDashboard(params),
    // Dashboards may not have data yet on fresh tenants — fail soft.
    retry: 1,
  });
}
