/** erp-api payroll endpoints: process, payslips, advances, losses, claims. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const HRM = "/hrm";
const PAY = "/hrm/payroll";

export interface Payslip {
  id: number;
  employee?: number;
  employee_name?: string;
  employee_number?: string;
  payment_period?: string;
  pay_period?: string;
  period?: string;
  from_date?: string;
  to_date?: string;
  gross_pay?: string | number;
  basic_salary?: string | number;
  total_earnings?: string | number;
  total_deductions?: string | number;
  paye?: string | number;
  nssf?: string | number;
  shif?: string | number;
  nhif?: string | number;
  housing_levy?: string | number;
  net_pay?: string | number;
  status?: string;
  payment_status?: string;
  currency?: string;
  earnings?: PayslipLine[];
  deductions?: PayslipLine[];
  benefits?: PayslipLine[];
  [key: string]: unknown;
}

export interface PayslipLine {
  id?: number;
  name?: string;
  label?: string;
  amount?: string | number;
}

export interface PayrollEmployee {
  id: number;
  employee?: number;
  employee_name?: string;
  first_name?: string;
  last_name?: string;
  employee_number?: string;
  basic_salary?: string | number;
  net_pay?: string | number;
  selected?: boolean;
  [key: string]: unknown;
}

export interface PayrollPreviewRow {
  employee?: number;
  employee_name?: string;
  gross_pay?: string | number;
  paye?: string | number;
  nssf?: string | number;
  shif?: string | number;
  housing_levy?: string | number;
  total_deductions?: string | number;
  net_pay?: string | number;
  [key: string]: unknown;
}

export interface PayrollProcessPayload {
  employment_type?: string;
  from_date?: string;
  to_date?: string;
  payment_period?: string;
  outlet_id?: string | null;
  employee_ids?: number[];
}

export interface PayrollRun {
  id: number;
  payment_period?: string;
  period?: string;
  from_date?: string;
  to_date?: string;
  employment_type?: string;
  status?: string;
  total_net_pay?: string | number;
  total_gross_pay?: string | number;
  employee_count?: number;
  created_at?: string;
  disbursed?: boolean;
  [key: string]: unknown;
}

export const payrollApi = {
  // Runs / processed records grouped by period
  listRuns: (params?: ListParams) =>
    apiClient.get<Paginated<PayrollRun> | PayrollRun[]>(`${PAY}/payroll/`, params),
  getPayslip: (id: number | string) => apiClient.get<Payslip>(`${PAY}/payroll/${id}/`),
  deleteRecord: (id: number | string) => apiClient.delete<void>(`${PAY}/payroll/${id}/`),

  // Employees eligible for a payroll run
  payrollEmployees: (params?: ListParams) =>
    apiClient.get<Paginated<PayrollEmployee> | PayrollEmployee[]>(`${PAY}/payroll/employees/`, params),

  // Preview (calculation) before committing
  preview: (payload: PayrollProcessPayload) =>
    apiClient.post<{ results?: PayrollPreviewRow[]; data?: PayrollPreviewRow[] } | PayrollPreviewRow[]>(
      `${HRM}/payroll/calculation-preview/`,
      payload,
    ),

  // Run / process payroll
  process: (payload: PayrollProcessPayload) =>
    apiClient.post<{ task_id?: string; status?: string; message?: string }>(
      `${HRM}/payroll/process-with-formulas/`,
      payload,
    ),

  // Generic command on the payroll collection (used for disburse/finalize actions)
  command: (payload: Record<string, unknown>) =>
    apiClient.post<{ status?: string; message?: string }>(`${PAY}/payroll/`, payload),

  // Disburse a processed period
  disburse: (payload: { payment_period?: string; from_date?: string; to_date?: string; run_id?: number }) =>
    apiClient.post<{ status?: string; message?: string }>(`${PAY}/payroll/`, {
      command: "disburse",
      ...payload,
    }),

  taskStatus: (taskId: string) =>
    apiClient.get<{ state?: string; progress?: number; status?: string; result?: unknown }>(
      `${HRM}/payroll/task_status/`,
      { task_id: taskId },
    ),

  // Payslip emailing
  emailPayslips: (data: Record<string, unknown>) =>
    apiClient.post<{ status?: string }>(`${HRM}/payroll/email-payslips`, data),

  // Advances
  listAdvances: (params?: ListParams) =>
    apiClient.get<Paginated<PayComponentRecord> | PayComponentRecord[]>(`${PAY}/advances/`, params),
  createAdvance: (data: Partial<PayComponentRecord>) =>
    apiClient.post<PayComponentRecord>(`${PAY}/advances/`, data),
  updateAdvance: (id: number, data: Partial<PayComponentRecord>) =>
    apiClient.put<PayComponentRecord>(`${PAY}/advances/${id}/`, data),
  deleteAdvance: (id: number) => apiClient.delete<void>(`${PAY}/advances/${id}/`),

  // Losses & damages
  listLossDamages: (params?: ListParams) =>
    apiClient.get<Paginated<PayComponentRecord> | PayComponentRecord[]>(`${PAY}/losses-damages/`, params),
  createLossDamage: (data: Partial<PayComponentRecord>) =>
    apiClient.post<PayComponentRecord>(`${PAY}/losses-damages/`, data),
  updateLossDamage: (id: number, data: Partial<PayComponentRecord>) =>
    apiClient.put<PayComponentRecord>(`${PAY}/losses-damages/${id}/`, data),
  deleteLossDamage: (id: number) => apiClient.delete<void>(`${PAY}/losses-damages/${id}/`),

  // Claims
  listClaims: (params?: ListParams) =>
    apiClient.get<Paginated<Claim> | Claim[]>(`${HRM}/payroll/claims/`, params),
  getClaim: (id: number) => apiClient.get<Claim>(`${HRM}/payroll/claims/${id}/`),
  createClaim: (data: Partial<Claim>) => apiClient.post<Claim>(`${HRM}/payroll/claims/`, data),
  updateClaim: (id: number, data: Partial<Claim>) =>
    apiClient.put<Claim>(`${HRM}/payroll/claims/${id}/`, data),
  deleteClaim: (id: number) => apiClient.delete<void>(`${HRM}/payroll/claims/${id}/`),
};

export interface PayComponentRecord {
  id: number;
  employee?: number;
  employee_name?: string;
  amount?: string | number;
  description?: string;
  reason?: string;
  date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Claim {
  id: number;
  employee?: number;
  employee_name?: string;
  claim_type?: string;
  amount?: string | number;
  description?: string;
  status?: string;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
}
