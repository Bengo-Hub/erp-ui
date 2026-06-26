/** erp-api payroll settings: components, deductions/earnings/benefits, loans, formulas, relief/tax. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const PS = "/hrm/payroll-settings";

export type ComponentCategory = "Earnings" | "Deductions" | "Benefits";

export interface PayrollComponent {
  id: number;
  name: string;
  category?: ComponentCategory | string;
  /** Employee-side default amount + percentage (percent_of = base the % applies to). */
  amount?: string | number;
  percentage?: string | number;
  percent_of?: string;
  /** Employer contribution side (split deductions: NSSF, pension, etc.). */
  employer_amount?: string | number;
  employer_percentage?: string | number;
  /** Per-unit earnings (Daily Wages, Overtime): unit_type=days|hours|pieces. */
  unit_type?: string;
  unit_rate?: string | number;
  quantity?: string | number;
  registration_no?: string;
  checkoff?: boolean;
  mode?: string;
  effective_from?: string;
  effective_to?: string;
  is_taxable?: boolean;
  is_active?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface Loan {
  id: number;
  name: string;
  interest_rate?: string | number;
  max_amount?: string | number;
  repayment_period?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface Formula {
  id: number;
  name: string;
  type?: string;
  category?: string;
  is_current?: boolean;
  effective_date?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ReliefStatus {
  relief_type?: string;
  is_active?: boolean;
  amount?: string | number;
  effective_date?: string;
  [key: string]: unknown;
}

const COMPONENTS = `${PS}/payroll-components`;

/** Build a category-scoped component CRUD (Earnings/Deductions/Benefits). */
function componentCrud(category: ComponentCategory) {
  return {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<PayrollComponent> | PayrollComponent[]>(`${COMPONENTS}/`, {
        ...params,
        category,
      }),
    get: (id: number | string) => apiClient.get<PayrollComponent>(`${COMPONENTS}/${id}/`),
    create: (data: Partial<PayrollComponent>) =>
      apiClient.post<PayrollComponent>(`${COMPONENTS}/`, { ...data, category }),
    update: (id: number | string, data: Partial<PayrollComponent>) =>
      apiClient.put<PayrollComponent>(`${COMPONENTS}/${id}/`, { ...data, category }),
    remove: (id: number | string) => apiClient.delete<void>(`${COMPONENTS}/${id}/`),
  };
}

export const earningsApi = componentCrud("Earnings");
export const deductionsApi = componentCrud("Deductions");
export const benefitsApi = componentCrud("Benefits");

export const componentsApi = {
  listAll: (params?: ListParams) =>
    apiClient.get<Paginated<PayrollComponent> | PayrollComponent[]>(`${COMPONENTS}/`, params),
};

export const loansApi = {
  list: (params?: ListParams) => apiClient.get<Paginated<Loan> | Loan[]>(`${PS}/loans/`, params),
  get: (id: number | string) => apiClient.get<Loan>(`${PS}/loans/${id}/`),
  create: (data: Partial<Loan>) => apiClient.post<Loan>(`${PS}/loans/`, data),
  update: (id: number | string, data: Partial<Loan>) =>
    apiClient.put<Loan>(`${PS}/loans/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`${PS}/loans/${id}/`),
};

export const formulasApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Formula> | Formula[]>(`${PS}/formulas/`, params),
  get: (id: number | string) => apiClient.get<Formula>(`${PS}/formulas/${id}/`),
  create: (data: Partial<Formula>) => apiClient.post<Formula>(`${PS}/formulas/`, data),
  update: (id: number | string, data: Partial<Formula>) =>
    apiClient.put<Formula>(`${PS}/formulas/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`${PS}/formulas/${id}/`),
  byType: (type: string, params?: ListParams) =>
    apiClient.get<Paginated<Formula> | Formula[]>(`${PS}/formulas/`, { ...params, type }),
  reliefStatus: (relief_type: string) =>
    apiClient.get<ReliefStatus>(`${PS}/formulas/relief-status/`, { relief_type }),
  updateRelief: (data: { relief_type: string; is_active: boolean; effective_date?: string }) =>
    apiClient.post<ReliefStatus>(`${PS}/formula-management/`, {
      operation: "update_relief",
      ...data,
    }),
};

/** General HR / statutory settings singleton. */
export interface GeneralHrSettings {
  id?: number;
  paye_enabled?: boolean;
  nssf_enabled?: boolean;
  shif_enabled?: boolean;
  housing_levy_enabled?: boolean;
  nita_enabled?: boolean;
  personal_relief?: string | number;
  insurance_relief_rate?: string | number;
  housing_levy_rate?: string | number;
  shif_rate?: string | number;
  [key: string]: unknown;
}

export const generalHrApi = {
  get: () =>
    apiClient.get<GeneralHrSettings | GeneralHrSettings[] | Paginated<GeneralHrSettings>>(
      `${PS}/general-hr-settings/`,
    ),
  update: (id: number | string, data: Partial<GeneralHrSettings>) =>
    apiClient.put<GeneralHrSettings>(`${PS}/general-hr-settings/${id}/`, data),
  create: (data: Partial<GeneralHrSettings>) =>
    apiClient.post<GeneralHrSettings>(`${PS}/general-hr-settings/`, data),
};
