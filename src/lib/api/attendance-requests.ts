/**
 * Attendance settings, correction (regularisation) requests and overtime requests.
 * Decisions on requests go through the approvals engine (/approvals/requests/{id}/approve|reject).
 */

import { apiClient } from "@/lib/api/client";
import { type Paginated } from "@/lib/api/drf";
import { emptyPage, orFallback } from "@/lib/api/not-found";
import { type GeoMode } from "@/lib/api/attendance-self";

const ATT = "/hrm/attendance";

export interface AttendanceSettings {
  geo_mode: GeoMode;
  geo_tolerance_m: number;
  require_photo: boolean;
  device_online_minutes: number;
  auto_absent_enabled: boolean;
  /** HH:MM, company time. */
  auto_absent_time: string;
  ot_threshold_hours: number;
  ot_max_hours: number;
  min_work_hours: number;
  ot_multiplier: number;
  holiday_multiplier: number;
  early_leave_grace_minutes: number;
  punch_pair_window_minutes: number;
}

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Regularisation {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  reason: string;
  status: RequestStatus;
  approval_request_id?: string | null;
  record_id?: string | null;
  before?: { check_in?: string | null; check_out?: string | null } | null;
  created_at?: string;
}

export interface RegularisationInput {
  /** HR only; self-service requests are always for the caller. */
  employee_id?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  reason: string;
}

export interface OvertimeRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  hours: number;
  reason: string;
  status: RequestStatus;
  approval_request_id?: string | null;
  created_at?: string;
}

export interface OvertimeInput {
  employee_id?: string;
  date: string;
  hours: number;
  reason: string;
}

export interface RequestFilters {
  status?: string;
  from?: string;
  to?: string;
  employee_id?: string;
  page?: number;
  limit?: number;
}

const list = <T>(url: string, params?: object) =>
  orFallback(apiClient.get<Paginated<T>>(url, params), emptyPage<T>());

export const attendanceSettingsApi = {
  /** Null when the tenant's erp-api has no attendance settings route yet. */
  get: () => orFallback<AttendanceSettings | null>(apiClient.get<AttendanceSettings>(`${ATT}/settings`), null),
  save: (data: AttendanceSettings) => apiClient.put<AttendanceSettings>(`${ATT}/settings`, data),
};

export const regularisationsApi = {
  list: (params?: RequestFilters) => list<Regularisation>(`${ATT}/regularisations`, params),
  create: (data: RegularisationInput) => apiClient.post<Regularisation>(`${ATT}/regularisations`, data),
};

export const overtimeRequestsApi = {
  list: (params?: RequestFilters) => list<OvertimeRequest>(`${ATT}/overtime-requests`, params),
  create: (data: OvertimeInput) => apiClient.post<OvertimeRequest>(`${ATT}/overtime-requests`, data),
};

export const approvalDecisionApi = {
  approve: (requestId: string, comment?: string) =>
    apiClient.post(`/approvals/requests/${requestId}/approve`, { comment: comment ?? "" }),
  reject: (requestId: string, comment: string) => apiClient.post(`/approvals/requests/${requestId}/reject`, { comment }),
};
