/** erp-api payroll endpoints: process, payslips, advances, losses, claims. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const HRM = "/hrm";
const PAY = "/hrm/payroll";

export interface Payslip {
  id: number | string;
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
  id: number | string;
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
  department_id?: string;
  region_id?: string;
  project_id?: string;
  employee_ids?: number[];
}

export interface PayrollRun {
  id: number | string;
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

  /**
   * Download a tenant-branded payslip PDF (auth-only; server enforces self-or-manager).
   * NOTE: the PDF route is `/hrm/payroll/{id}/pdf` (single `payroll`), registered by the
   * DocumentsHandler — NOT under the `/hrm/payroll/payroll/...` CRUD subroute.
   */
  payslipPdf: (id: number | string) =>
    apiClient.getBlob(`${PAY}/${id}/pdf`, `payslip_${id}.pdf`),

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

  // Approve / reject a processed period (the review step between process and disburse).
  approve: (payload: { payment_period?: string; outlet_id?: string }) =>
    apiClient.post<{ status?: string; count?: number }>(`${PAY}/payroll/`, { command: "approve", ...payload }),
  reject: (payload: { payment_period?: string; outlet_id?: string }) =>
    apiClient.post<{ status?: string; count?: number }>(`${PAY}/payroll/`, { command: "reject", ...payload }),

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
  updateAdvance: (id: number | string, data: Partial<PayComponentRecord>) =>
    apiClient.put<PayComponentRecord>(`${PAY}/advances/${id}/`, data),
  deleteAdvance: (id: number | string) => apiClient.delete<void>(`${PAY}/advances/${id}/`),
  // Approve → Scheduled (approved+active); Disapprove → Disapproved (approved=false).
  approveAdvance: (id: number | string) =>
    apiClient.post<PayComponentRecord>(`${PAY}/advances/${id}/approve`, {}),
  disapproveAdvance: (id: number | string) =>
    apiClient.post<PayComponentRecord>(`${PAY}/advances/${id}/disapprove`, {}),

  // Losses & damages
  listLossDamages: (params?: ListParams) =>
    apiClient.get<Paginated<PayComponentRecord> | PayComponentRecord[]>(`${PAY}/losses-damages/`, params),
  createLossDamage: (data: Partial<PayComponentRecord>) =>
    apiClient.post<PayComponentRecord>(`${PAY}/losses-damages/`, data),
  updateLossDamage: (id: number | string, data: Partial<PayComponentRecord>) =>
    apiClient.put<PayComponentRecord>(`${PAY}/losses-damages/${id}/`, data),
  deleteLossDamage: (id: number | string) => apiClient.delete<void>(`${PAY}/losses-damages/${id}/`),
  approveLossDamage: (id: number | string) =>
    apiClient.post<PayComponentRecord>(`${PAY}/losses-damages/${id}/approve`, {}),
  disapproveLossDamage: (id: number | string) =>
    apiClient.post<PayComponentRecord>(`${PAY}/losses-damages/${id}/disapprove`, {}),

  // Claims
  listClaims: (params?: ListParams) =>
    apiClient.get<Paginated<Claim> | Claim[]>(`${HRM}/payroll/claims/`, params),
  getClaim: (id: number | string) => apiClient.get<Claim>(`${HRM}/payroll/claims/${id}/`),
  createClaim: (data: Partial<Claim>) => apiClient.post<Claim>(`${HRM}/payroll/claims/`, data),
  updateClaim: (id: number | string, data: Partial<Claim>) =>
    apiClient.put<Claim>(`${HRM}/payroll/claims/${id}/`, data),
  deleteClaim: (id: number | string) => apiClient.delete<void>(`${HRM}/payroll/claims/${id}/`),
  // Approve a claim -> emits erp.expense_claim.approved so treasury posts the reimbursement to GL.
  approveClaim: (id: number | string) =>
    apiClient.post<Claim>(`${HRM}/payroll/claims/${id}/approve`, {}),

  // Claim line items (reimbursement / other) — date/description/expense_type/quantity/unit_cost/amount.
  listClaimItems: (claimId: number | string) =>
    apiClient.get<{ results?: ClaimItem[]; data?: ClaimItem[] } | ClaimItem[]>(
      `${HRM}/payroll/claims/${claimId}/items`,
    ),
  createClaimItem: (claimId: number | string, data: Partial<ClaimItem>) =>
    apiClient.post<ClaimItem>(`${HRM}/payroll/claims/${claimId}/items`, data),
  deleteClaimItem: (claimId: number | string, itemId: number | string) =>
    apiClient.delete<void>(`${HRM}/payroll/claims/${claimId}/items/${itemId}`),

  // Claim mileage routes (mileage claim_type) — from/to/distance/rate → amount.
  listMileageRoutes: (claimId: number | string) =>
    apiClient.get<{ results?: MileageRoute[]; data?: MileageRoute[] } | MileageRoute[]>(
      `${HRM}/payroll/claims/${claimId}/mileage-routes`,
    ),
  createMileageRoute: (claimId: number | string, data: Partial<MileageRoute>) =>
    apiClient.post<MileageRoute>(`${HRM}/payroll/claims/${claimId}/mileage-routes`, data),
  deleteMileageRoute: (claimId: number | string, routeId: number | string) =>
    apiClient.delete<void>(`${HRM}/payroll/claims/${claimId}/mileage-routes/${routeId}`),

  // Multipart attachment upload (form field name: `file`) → sets attachment_url on the claim.
  uploadClaimAttachment: (claimId: number | string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.post<{ attachment_url?: string; attachment_path?: string }>(
      `${HRM}/payroll/claims/${claimId}/attachment`,
      fd,
    );
  },

  // Casual / subcontracted labour register.
  listCasualLabor: (params?: ListParams) =>
    apiClient.get<Paginated<CasualLabor> | CasualLabor[]>(`${HRM}/payroll/casual-labor`, params),
  createCasualLabor: (data: Partial<CasualLabor>) =>
    apiClient.post<CasualLabor>(`${HRM}/payroll/casual-labor`, data),
  updateCasualLabor: (id: number | string, data: Partial<CasualLabor>) =>
    apiClient.put<CasualLabor>(`${HRM}/payroll/casual-labor/${id}`, data),
  approveCasualLabor: (id: number | string) =>
    apiClient.post<CasualLabor>(`${HRM}/payroll/casual-labor/${id}/approve`, {}),
  deleteCasualLabor: (id: number | string) =>
    apiClient.delete<void>(`${HRM}/payroll/casual-labor/${id}`),

  // Consultant WHT payment vouchers.
  listConsultantVouchers: (params?: ListParams) =>
    apiClient.get<{ results: ConsultantVoucher[]; count: number; page_total?: string } | ConsultantVoucher[]>(
      `${PAY}/consultant-vouchers`,
      params,
    ),
  createConsultantVoucher: (data: Partial<ConsultantVoucher>) =>
    apiClient.post<ConsultantVoucher>(`${PAY}/consultant-vouchers`, data),
  approveConsultantVoucher: (id: number | string) =>
    apiClient.post<ConsultantVoucher>(`${PAY}/consultant-vouchers/${id}/approve`, {}),
  deleteConsultantVoucher: (id: number | string) =>
    apiClient.delete<void>(`${PAY}/consultant-vouchers/${id}`),
  consultantVoucherPdf: (id: number | string) =>
    apiClient.getBlob(`${PAY}/consultant-vouchers/${id}/pdf`, `voucher_${id}.pdf`),
  emailConsultantVouchers: (data: { ids: (number | string)[]; message?: string }) =>
    apiClient.post<{ queued: number; skipped: number }>(`${PAY}/consultant-vouchers/email`, data),

  // Employee/consultant ↔ project allocations.
  listAllocations: (params?: ListParams) =>
    apiClient.get<{ results: ProjectAllocation[]; count: number } | ProjectAllocation[]>(
      `${HRM}/project-allocations`,
      params,
    ),
  createAllocation: (data: Partial<ProjectAllocation>) =>
    apiClient.post<ProjectAllocation>(`${HRM}/project-allocations`, data),
  updateAllocation: (id: number | string, data: Partial<ProjectAllocation>) =>
    apiClient.put<ProjectAllocation>(`${HRM}/project-allocations/${id}`, data),
  deleteAllocation: (id: number | string) =>
    apiClient.delete<void>(`${HRM}/project-allocations/${id}`),
};

export interface ProjectAllocation {
  id: number | string;
  employee_id?: string;
  project_id?: string;
  project_name?: string;
  cost_center_id?: string;
  allocation_percent?: string | number;
  fixed_amount?: number;
  is_active?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface CasualLabor {
  id: number | string;
  // settlement_mode: direct_payout (casual employee) | reimburse_engager (informal worker).
  settlement_mode?: string;
  employee_id?: string;
  employee_name?: string;
  employee_number?: string;
  worker_name?: string;
  worker_id_number?: string;
  worker_phone?: string;
  task_description?: string;
  // wage_type: daily_wages | hourly_wages | overtime_1_5x | overtime_2x | payment_in_lieu | lump_sum
  wage_type?: string;
  quantity?: string | number;
  rate?: string | number;
  amount?: string | number;
  payment_option?: string;
  payment_method?: string;
  payment_date?: string;
  payroll_month?: string;
  work_date?: string;
  status?: string;
  project_id?: string;
  cost_center_id?: string;
  engaged_by_employee_id?: string;
  /** Optional link to a salary advance used as a float/imprest to pay the casual worker. */
  imprest_advance_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ConsultantVoucher {
  id: number | string;
  doc_number?: string;
  title?: string;
  period?: string;
  employee_id?: string;
  employee_name?: string;
  name?: string;
  gross_amount?: string | number;
  deductions_amount?: string | number;
  wht_rate?: string | number;
  wht_amount?: string | number;
  net_amount?: string | number;
  is_resident?: boolean;
  currency?: string;
  status?: string;
  email_status?: string;
  project_id?: string;
  cost_center_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** Wingubox casual wage-addition types (the Add Casual Payments dropdown). */
export const CASUAL_WAGE_TYPES = [
  { value: "daily_wages", label: "Daily Wages" },
  { value: "hourly_wages", label: "Hourly Wages" },
  { value: "overtime_1_5x", label: "Overtime @1.5x" },
  { value: "overtime_2x", label: "Overtime @2x" },
  { value: "payment_in_lieu", label: "Payment in Lieu of Leave" },
] as const;

/** Settlement rails for casual payouts (Salary Payment Option). */
export const CASUAL_PAYMENT_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "equity_bank", label: "Equity Bank" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
] as const;

export interface PayComponentRecord {
  id: number | string;
  employee?: number;
  employee_id?: string;
  employee_name?: string;
  amount?: string | number;
  amount_repaid?: string | number;
  description?: string;
  reason?: string;
  date?: string;
  status?: string;
  approved?: boolean;
  is_active?: boolean;
  // Installment recovery: no_of_installments>=2 makes the backend create/update a RepayOption.
  repay_option_id?: string | null;
  no_of_installments?: number;
  [key: string]: unknown;
}

export interface Claim {
  id: number | string;
  employee?: number;
  employee_id?: string;
  employee_name?: string;
  claim_type?: string;
  category?: string;
  amount?: string | number;
  description?: string;
  status?: string;
  date?: string;
  created_at?: string;
  attachment_url?: string;
  // Analytic + tax linkage (treasury posts non-taxable claims to AP, taxable via payslip).
  project_id?: string;
  cost_center_id?: string;
  taxable?: boolean;
  approved?: boolean;
  [key: string]: unknown;
}

/** Itemized expense line (reimbursement / other claims). quantity/unit_cost are calc-only;
 * the backend persists only `amount` (= quantity × unit_cost when not given explicitly). */
export interface ClaimItem {
  id: number | string;
  expense_claim_id?: string;
  date?: string;
  description?: string;
  expense_type?: string;
  quantity?: string | number;
  unit_cost?: string | number;
  amount?: string | number;
  created_at?: string;
  [key: string]: unknown;
}

/** Mileage trip line (mileage claims). amount = distance × rate. The backend accepts both
 * `from`/`to` and `from_location`/`to_location` and echoes both in the view. */
export interface MileageRoute {
  id: number | string;
  expense_claim_id?: string;
  date?: string;
  from?: string;
  to?: string;
  from_location?: string;
  to_location?: string;
  distance?: string | number;
  rate?: string | number;
  amount?: string | number;
  created_at?: string;
  [key: string]: unknown;
}
