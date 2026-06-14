/** erp-api leave endpoints: requests, balances, entitlements, categories (types), logs. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const LEAVE = "/hrm/leave";

export interface LeaveRequest {
  id: number;
  employee?: number;
  employee_name?: string;
  leave_category?: number;
  leave_category_name?: string;
  category_name?: string;
  start_date?: string;
  end_date?: string;
  days?: string | number;
  number_of_days?: string | number;
  reason?: string;
  status?: string;
  rejection_reason?: string;
  approved_by?: number | string;
  created_at?: string;
  [key: string]: unknown;
}

export interface LeaveCategory {
  id: number;
  name?: string;
  description?: string;
  max_days?: string | number;
  days_allowed?: string | number;
  is_paid?: boolean;
  carry_forward?: boolean;
  requires_approval?: boolean;
  [key: string]: unknown;
}

export interface LeaveBalance {
  id: number;
  employee?: number;
  employee_name?: string;
  leave_category?: number;
  leave_category_name?: string;
  category_name?: string;
  year?: number | string;
  entitled?: string | number;
  total_days?: string | number;
  used?: string | number;
  used_days?: string | number;
  remaining?: string | number;
  balance?: string | number;
  [key: string]: unknown;
}

export interface LeaveEntitlement {
  id: number;
  employee?: number;
  employee_name?: string;
  leave_category?: number;
  leave_category_name?: string;
  days?: string | number;
  year?: number | string;
  [key: string]: unknown;
}

export interface LeaveLog {
  id: number;
  employee?: number;
  employee_name?: string;
  action?: string;
  description?: string;
  created_at?: string;
  [key: string]: unknown;
}

export const leaveApi = {
  // Requests
  listRequests: (params?: ListParams) =>
    apiClient.get<Paginated<LeaveRequest> | LeaveRequest[]>(`${LEAVE}/requests/`, params),
  getRequest: (id: number | string) => apiClient.get<LeaveRequest>(`${LEAVE}/requests/${id}/`),
  createRequest: (data: Partial<LeaveRequest>) =>
    apiClient.post<LeaveRequest>(`${LEAVE}/requests/`, data),
  updateRequest: (id: number | string, data: Partial<LeaveRequest>) =>
    apiClient.put<LeaveRequest>(`${LEAVE}/requests/${id}/`, data),
  deleteRequest: (id: number | string) => apiClient.delete<void>(`${LEAVE}/requests/${id}/`),
  approveRequest: (id: number | string) =>
    apiClient.post<LeaveRequest>(`${LEAVE}/requests/${id}/approve/`, {}),
  rejectRequest: (id: number | string, reason: string) =>
    apiClient.post<LeaveRequest>(`${LEAVE}/requests/${id}/reject/`, { rejection_reason: reason }),

  // Categories (leave types)
  listCategories: (params?: ListParams) =>
    apiClient.get<Paginated<LeaveCategory> | LeaveCategory[]>(`${LEAVE}/categories/`, params),
  createCategory: (data: Partial<LeaveCategory>) =>
    apiClient.post<LeaveCategory>(`${LEAVE}/categories/`, data),
  updateCategory: (id: number | string, data: Partial<LeaveCategory>) =>
    apiClient.put<LeaveCategory>(`${LEAVE}/categories/${id}/`, data),
  deleteCategory: (id: number | string) => apiClient.delete<void>(`${LEAVE}/categories/${id}/`),

  // Balances
  listBalances: (params?: ListParams) =>
    apiClient.get<Paginated<LeaveBalance> | LeaveBalance[]>(`${LEAVE}/balances/`, params),
  createBalance: (data: Partial<LeaveBalance>) =>
    apiClient.post<LeaveBalance>(`${LEAVE}/balances/`, data),
  updateBalance: (id: number | string, data: Partial<LeaveBalance>) =>
    apiClient.put<LeaveBalance>(`${LEAVE}/balances/${id}/`, data),
  deleteBalance: (id: number | string) => apiClient.delete<void>(`${LEAVE}/balances/${id}/`),

  // Entitlements
  listEntitlements: (params?: ListParams) =>
    apiClient.get<Paginated<LeaveEntitlement> | LeaveEntitlement[]>(`${LEAVE}/entitlements/`, params),
  createEntitlement: (data: Partial<LeaveEntitlement>) =>
    apiClient.post<LeaveEntitlement>(`${LEAVE}/entitlements/`, data),
  updateEntitlement: (id: number | string, data: Partial<LeaveEntitlement>) =>
    apiClient.put<LeaveEntitlement>(`${LEAVE}/entitlements/${id}/`, data),
  deleteEntitlement: (id: number | string) =>
    apiClient.delete<void>(`${LEAVE}/entitlements/${id}/`),

  // Logs
  listLogs: (params?: ListParams) =>
    apiClient.get<Paginated<LeaveLog> | LeaveLog[]>(`${LEAVE}/logs/`, params),
};
