/** erp-api HR dashboard analytics (GET /reports/hrm-analytics, grouped in SQL). */

import { apiClient } from "@/lib/api/client";

export interface MetricBucket {
  label?: string;
  name?: string;
  value?: number;
  count?: number;
  [key: string]: unknown;
}

export interface PayrollTrendPoint {
  month: string;
  gross: number;
  net: number;
  employees: number;
}

export interface HrmDashboard {
  headcount_metrics?: {
    total_employees?: number;
    terminated?: number;
    expiring_contracts?: number; // within 30 days
    expiring_60?: number;
    expiring_90?: number;
    new_hires?: number; // joined this month
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
    month?: string;
    total_net_pay?: number;
    total_gross_pay?: number;
    [key: string]: unknown;
  };
  demographics?: {
    gender_distribution?: { personal_details__gender?: string; count?: number }[];
    employment_types?: MetricBucket[];
    [key: string]: unknown;
  };
  headcount_by_department?: MetricBucket[];
  payroll_by_department?: MetricBucket[];
  payroll_trend?: PayrollTrendPoint[];
  [key: string]: unknown;
}

/** Wire shape of erp-api reports.HRMAnalytics. Money arrives as decimal strings. */
interface HrmAnalyticsResponse {
  headcount: number;
  terminated: number;
  new_hires: number;
  by_department: { key: string; label: string; count: number }[] | null;
  by_gender: { key: string; label: string; count: number }[] | null;
  by_employment_type: { key: string; label: string; count: number }[] | null;
  contracts_expiring: { within_30_days: number; within_60_days: number; within_90_days: number };
  payroll_trend: { month: string; gross: string | number; net: string | number; employees: number }[] | null;
  payroll_by_department: { key: string; label: string; amount: string | number }[] | null;
}

/** erp-api summary report envelope ({report,columns,rows,totals}). */
interface SummaryReport {
  totals?: Record<string, unknown>;
}

const numOf = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0);

export const analyticsApi = {
  hrmDashboard: async (params?: Record<string, unknown>): Promise<HrmDashboard> => {
    const year = (params?.year as number) ?? new Date().getFullYear();
    const [analytics, leave] = await Promise.allSettled([
      apiClient.get<HrmAnalyticsResponse>(`/reports/hrm-analytics`, params),
      apiClient.get<SummaryReport>(`/reports/leave-summary`, { year, ...params }),
    ]);
    if (analytics.status === "rejected") throw analytics.reason;
    const a = analytics.value;
    const lv = leave.status === "fulfilled" ? (leave.value.totals ?? {}) : {};
    const trend: PayrollTrendPoint[] = (a.payroll_trend ?? []).map((p) => ({
      month: p.month,
      gross: numOf(p.gross),
      net: numOf(p.net),
      employees: p.employees,
    }));
    const latest = trend[trend.length - 1];
    return {
      headcount_metrics: {
        total_employees: a.headcount,
        terminated: a.terminated,
        new_hires: a.new_hires,
        expiring_contracts: a.contracts_expiring?.within_30_days ?? 0,
        expiring_60: a.contracts_expiring?.within_60_days ?? 0,
        expiring_90: a.contracts_expiring?.within_90_days ?? 0,
      },
      leave_metrics: { pending_requests: numOf(lv.pending_requests) },
      // Attendance rate has no backend yet; the tile shows a dash rather than a made-up figure.
      attendance_metrics: {},
      payroll_metrics: latest
        ? { month: latest.month, total_gross_pay: latest.gross, total_net_pay: latest.net }
        : {},
      demographics: {
        gender_distribution: (a.by_gender ?? []).map((g) => ({ personal_details__gender: g.label, count: g.count })),
        employment_types: (a.by_employment_type ?? []).map((t) => ({ label: t.label, value: t.count })),
      },
      headcount_by_department: (a.by_department ?? []).map((d) => ({ label: d.label, value: d.count })),
      payroll_by_department: (a.payroll_by_department ?? []).map((d) => ({ label: d.label, value: numOf(d.amount) })),
      payroll_trend: trend,
    };
  },
};
