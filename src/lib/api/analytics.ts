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

export const analyticsApi = {
  hrmDashboard: (params?: Record<string, unknown>) =>
    apiClient.get<HrmDashboard>(`/hrm/analytics/`, params),
  payroll: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>(`/hrm/payroll/analytics/`, params),
  leave: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>(`/hrm/leave/analytics/`, params),
  attendance: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>(`/hrm/attendance/analytics/`, params),
};
