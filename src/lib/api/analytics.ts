/** erp-api HRM analytics dashboards (/hrm/analytics + domain analytics). */

import { apiClient } from "@/lib/api/client";

export interface MetricBucket {
  label?: string;
  name?: string;
  value?: number;
  count?: number;
  [key: string]: unknown;
}

export interface HrmDashboard {
  headcount_metrics?: {
    total_employees?: number;
    previous_total?: number;
    turnover_rate?: number;
    expiring_contracts?: number;
    new_hires?: number;
    [key: string]: unknown;
  };
  attendance_metrics?: {
    attendance_rate?: number;
    previous_rate?: number;
    [key: string]: unknown;
  };
  leave_metrics?: {
    approval_rate?: number;
    previous_approval_rate?: number;
    pending_requests?: number;
    [key: string]: unknown;
  };
  payroll_metrics?: {
    total_net_pay?: number;
    total_gross_pay?: number;
    total_paye?: number;
    [key: string]: unknown;
  };
  demographics?: {
    gender_distribution?: { personal_details__gender?: string; count?: number }[];
    [key: string]: unknown;
  };
  salary_analysis?: {
    salary_by_department?: { department__name?: string; total?: number; avg?: number }[];
    [key: string]: unknown;
  };
  headcount_by_department?: MetricBucket[];
  [key: string]: unknown;
}

/** erp-api summary report envelope ({report,columns,rows,totals}). */
interface SummaryReport {
  totals?: Record<string, unknown>;
  rows?: Record<string, unknown>[];
}

const numOf = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0);

/**
 * erp-api has no dedicated `/hrm/analytics` surface (gap). The HRM dashboard
 * is composed from the two summary report endpoints that DO exist:
 * `/reports/headcount-summary` and `/reports/leave-summary`. Payroll &
 * attendance analytics have no backend yet and are left empty.
 */
export const analyticsApi = {
  hrmDashboard: async (params?: Record<string, unknown>): Promise<HrmDashboard> => {
    const year = (params?.year as number) ?? new Date().getFullYear();
    const [headcount, leave] = await Promise.allSettled([
      apiClient.get<SummaryReport>(`/reports/headcount-summary`, params),
      apiClient.get<SummaryReport>(`/reports/leave-summary`, { year, ...params }),
    ]);
    const hc = headcount.status === "fulfilled" ? (headcount.value.totals ?? {}) : {};
    const lv = leave.status === "fulfilled" ? (leave.value.totals ?? {}) : {};
    return {
      headcount_metrics: {
        total_employees: numOf(hc.total),
        new_hires: numOf(hc.active),
        expiring_contracts: numOf(hc.terminated),
      },
      leave_metrics: {
        pending_requests: numOf(lv.pending_requests),
      },
      attendance_metrics: {},
      payroll_metrics: {},
    };
  },
  // No backend yet for these (gap) — resolve to empty objects so widgets render.
  payroll: async (): Promise<Record<string, unknown>> => ({}),
  leave: async (): Promise<Record<string, unknown>> => ({}),
  attendance: async (): Promise<Record<string, unknown>> => ({}),
};
