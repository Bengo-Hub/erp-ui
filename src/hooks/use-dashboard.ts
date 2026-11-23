"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "@/lib/api/analytics";
import { attendanceAnalyticsApi, type AttendanceAnalyticsParams } from "@/lib/api/attendance-analytics";

/** HRM analytics dashboard (headcount/attendance/leave/payroll widgets). */
export function useHrmDashboard(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "hrm", params ?? {}],
    queryFn: () => analyticsApi.hrmDashboard(params),
    // Dashboards may not have data yet on fresh tenants, so fail soft.
    retry: 1,
    enabled,
  });
}

/**
 * Today's attendance picture, the 30-day trend and the month's overtime, piece output and device
 * counts. The server caches it briefly, so a one-minute refresh keeps the strip current.
 */
export function useAttendanceAnalytics(params?: AttendanceAnalyticsParams, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "attendance", params ?? {}],
    queryFn: () => attendanceAnalyticsApi.get(params),
    retry: 1,
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
