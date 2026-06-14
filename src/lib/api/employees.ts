/** erp-api HRM employee endpoints (/hrm/employees, salary, bank, kin, contact). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const EMP = "/hrm/employees";
const HRM = "/hrm";

export interface Employee {
  id: number;
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

export const employeesApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Employee> | Employee[]>(`${EMP}/employees/`, params),
  get: (id: number | string) => apiClient.get<Employee>(`${EMP}/employees/${id}/`),
  create: (data: Partial<Employee>) => apiClient.post<Employee>(`${EMP}/employees/`, data),
  update: (id: number | string, data: Partial<Employee>) =>
    apiClient.put<Employee>(`${EMP}/employees/${id}/`, data),
  patch: (id: number | string, data: Partial<Employee>) =>
    apiClient.patch<Employee>(`${EMP}/employees/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`${EMP}/employees/${id}/`),

  importEmployees: (file: File, mapping?: Record<string, string>) => {
    const fd = new FormData();
    fd.append("file", file);
    if (mapping) fd.append("mapping", JSON.stringify(mapping));
    return apiClient.post<{ created?: number; errors?: unknown[] }>(
      `${EMP}/upload-employee-data/`,
      fd,
    );
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

  // Salary details (upsert via POST)
  getSalaryDetails: (employeeId: number | string) =>
    apiClient.get<EmployeeSalaryDetail[] | Paginated<EmployeeSalaryDetail>>(`${HRM}/salary-details/`, {
      emp_id: employeeId,
    }),
  upsertSalary: (employeeId: number | string, data: Partial<EmployeeSalaryDetail>) =>
    apiClient.post<EmployeeSalaryDetail>(`${HRM}/salary-details/`, { ...data, employee: employeeId }),
};
