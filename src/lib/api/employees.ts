/** erp-api HRM employee endpoints (/hrm/employees, salary, bank, kin, contact). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const EMP = "/hrm";
const HRM = "/hrm";

export interface Employee {
  /** erp-api employee id is a UUID string. */
  id: number | string;
  tenant_id?: string;
  user_id?: string | null;
  pin_no?: string;
  shif_or_nhif_number?: string;
  nssf_no?: string;
  residential_status?: string;
  terminated?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  employee_number?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone_number?: string;
  national_id?: string;
  kra_pin?: string;
  gender?: string;
  date_of_birth?: string;
  job_title?: number | { id: number; name: string } | null;
  job_title_name?: string;
  department?: number | { id: number; name: string } | null;
  department_name?: string;
  job_group?: number | { id: number; name: string } | null;
  outlet?: string | null;
  outlet_id?: string | null;
  employment_type?: string;
  employment_status?: string;
  status?: string;
  is_active?: boolean;
  date_joined?: string;
  basic_salary?: string | number;
  [key: string]: unknown;
}

export interface EmployeeBankAccount {
  id: number;
  employee?: number;
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  account_name?: string;
  is_primary?: boolean;
}

export interface EmployeeNextOfKin {
  id: number;
  employee?: number;
  name?: string;
  relationship?: string;
  phone_number?: string;
  email?: string;
  address?: string;
}

export interface EmployeeSalaryDetail {
  id?: number;
  employee?: number;
  basic_salary?: string | number;
  currency?: string;
  pay_frequency?: string;
  payment_method?: string;
  effective_date?: string;
  [key: string]: unknown;
}

/**
 * Maps the UI's (DRF-era) employee form fields onto the names erp-api's
 * create handler expects. The Go handler only reads a known subset
 * (employee_number, first/last name, email, gender, national_id, pin_no,
 * shif_or_nhif_number, nssf_no, residential_status, outlet_id, user_id) — the
 * rest are ignored server-side but harmless to send.
 */
function toEmployeePayload(data: Partial<Employee>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  // UI form uses kra_pin; erp-api field is pin_no.
  if (out.kra_pin != null && out.pin_no == null) out.pin_no = out.kra_pin;
  if (out.outlet != null && out.outlet_id == null) out.outlet_id = out.outlet;
  return out;
}

/** Per-row result from the bulk CSV import (erp-api POST /hrm/employees/import). */
export interface EmployeeImportRow {
  row: number;
  employee_number?: string;
  email?: string;
  status: "created" | "error";
  error?: string;
}
export interface EmployeeImportResult {
  total: number;
  created: number;
  failed: number;
  results: EmployeeImportRow[];
}

export const employeesApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Employee> | Employee[]>(`${EMP}/employees/`, params),
  get: (id: number | string) => apiClient.get<Employee>(`${EMP}/employees/${id}/`),
  create: (data: Partial<Employee>) =>
    apiClient.post<Employee>(`${EMP}/employees/`, toEmployeePayload(data)),
  // NOTE: erp-api has no PUT/PATCH on /hrm/employees/{id}; edit is not yet
  // supported server-side (gap). Kept pointing at the canonical path so it
  // works once the route lands.
  update: (id: number | string, data: Partial<Employee>) =>
    apiClient.put<Employee>(`${EMP}/employees/${id}/`, toEmployeePayload(data)),
  patch: (id: number | string, data: Partial<Employee>) =>
    apiClient.patch<Employee>(`${EMP}/employees/${id}/`, toEmployeePayload(data)),
  remove: (id: number | string) => apiClient.delete<void>(`${EMP}/employees/${id}/`),

  // Bulk CSV import → POST /hrm/employees/import (erp-api parses CSV, creates each
  // row independently, returns a per-row summary).
  importEmployees: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.post<EmployeeImportResult>(`${EMP}/employees/import`, fd);
  },

  // Bank accounts
  listBankAccounts: (employeeId: number | string) =>
    apiClient.get<EmployeeBankAccount[] | Paginated<EmployeeBankAccount>>(`${HRM}/bank-accounts/`, {
      emp_id: employeeId,
    }),
  addBankAccount: (employeeId: number | string, data: Partial<EmployeeBankAccount>) =>
    apiClient.post<EmployeeBankAccount>(`${HRM}/bank-accounts/`, { ...data, employee: employeeId }),
  updateBankAccount: (id: number, data: Partial<EmployeeBankAccount>) =>
    apiClient.put<EmployeeBankAccount>(`${HRM}/bank-accounts/${id}/`, data),
  removeBankAccount: (id: number) => apiClient.delete<void>(`${HRM}/bank-accounts/${id}/`),

  // Next of kin
  listNextOfKin: (employeeId: number | string) =>
    apiClient.get<EmployeeNextOfKin[] | Paginated<EmployeeNextOfKin>>(`${EMP}/next-of-kin/`, {
      emp_id: employeeId,
    }),
  addNextOfKin: (employeeId: number | string, data: Partial<EmployeeNextOfKin>) =>
    apiClient.post<EmployeeNextOfKin>(`${EMP}/next-of-kin/`, { ...data, employee: employeeId }),
  updateNextOfKin: (id: number, data: Partial<EmployeeNextOfKin>) =>
    apiClient.put<EmployeeNextOfKin>(`${EMP}/next-of-kin/${id}/`, data),
  removeNextOfKin: (id: number) => apiClient.delete<void>(`${EMP}/next-of-kin/${id}/`),

  // Salary details. erp-api exposes a single salary record per employee via
  // `PUT /hrm/employees/{id}/salary` (no list endpoint), so we read the salary
  // off the employee record and write through the real upsert route.
  getSalaryDetails: async (
    employeeId: number | string,
  ): Promise<EmployeeSalaryDetail[]> => {
    const emp = await apiClient.get<Employee>(`${EMP}/employees/${employeeId}/`);
    const salary = (emp as Record<string, unknown>).salary as
      | EmployeeSalaryDetail
      | undefined;
    if (salary) return [salary];
    if (emp.basic_salary != null) {
      return [{ employee: undefined, basic_salary: emp.basic_salary }];
    }
    return [];
  },
  upsertSalary: (employeeId: number | string, data: Partial<EmployeeSalaryDetail>) =>
    apiClient.put<EmployeeSalaryDetail>(`${EMP}/employees/${employeeId}/salary`, {
      monthly_salary:
        data.basic_salary != null ? String(data.basic_salary) : undefined,
      pay_mode: data.payment_method,
      currency: data.currency,
    }),

  /** Marks a bank account primary (the only mutation erp-api exposes for banks). */
  setPrimaryBankAccount: (employeeId: number | string, accountId: number | string) =>
    apiClient.put<{ ok: boolean }>(
      `${EMP}/employees/${employeeId}/bank-accounts/${accountId}/primary`,
      {},
    ),
};
