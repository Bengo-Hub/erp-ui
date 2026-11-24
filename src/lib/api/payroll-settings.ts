/** erp-api payroll settings: components, deductions/earnings/benefits, loans, formulas, relief/tax. */

import { apiClient } from '@/lib/api/client';
import { type ListParams, type Paginated } from '@/lib/api/drf';

const PS = '/hrm/payroll-settings';

export type ComponentCategory = 'Earnings' | 'Deductions' | 'Benefits';

/**
 * Where a payroll setting comes from. "platform" rows are defined once for every organisation
 * and inherited; "tenant" rows are this organisation's own (or its customised copy).
 */
export type SettingSource = 'platform' | 'tenant';

export interface PayrollComponent {
    id: number | string;
    /** Stable catalogue code (platform components), e.g. "house_allowance". */
    code?: string;
    name: string;
    source?: SettingSource;
    /** True when the component comes from the platform catalogue (customised or not). */
    is_platform?: boolean;
    /** The organisation changed the platform values (title, amount, rates). */
    customised?: boolean;
    /** Module that produces the amounts (loans, attendance, statutory_formula, ...). */
    managed_by?: string;
    /** Off until the organisation switches it on. */
    opt_in?: boolean;
    default_active?: boolean;
    statutory?: boolean;
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
    /** fixed | percent_of_basic | percent_of_gross — how the amount is computed. */
    mode?: string;
    /** Non-cash benefit (taxed but not paid in cash; e.g. company car/housing). */
    non_cash?: boolean;
    effective_from?: string;
    effective_to?: string;
    is_taxable?: boolean;
    is_active?: boolean;
    description?: string;
    [key: string]: unknown;
}

/** A loan product (Settings, Payroll, Loans): the type an employee loan is issued under. */
export interface LoanType {
    id: string;
    title: string;
    account_code?: string;
    is_active?: boolean;
}

/** A loan issued to one employee, recovered from payroll in monthly installments. */
export interface Loan {
    id: string;
    employee?: string;
    employee_id?: string;
    loan_type_id?: string;
    principal_amount?: string;
    amount_repaid?: string;
    balance?: string;
    monthly_installment?: string;
    installments?: number;
    installments_paid?: number;
    /** Set when issuing: the principal is spread evenly over this many months. */
    no_of_installments?: number;
    interest_rate?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    created_at?: string;
}

/** One payroll recovery against a loan. applied = written back to the loan balance. */
export interface LoanRecovery {
    id: string;
    payslip_id: string;
    payment_period: string;
    amount: string;
    applied: boolean;
    batch_ref?: string;
    created_at: string;
}

/** One band/bracket of a formula (percentages are stored as e.g. "30.00" = 30%). */
export interface FormulaItem {
    id?: string;
    amount_from?: string;
    amount_to?: string; // "0" = open-ended top band
    deduct_amount?: string;
    deduct_percentage?: string;
}

export interface Formula {
    id: number | string;
    name: string;
    source?: SettingSource;
    /** On a tenant row: the platform formula it replaces. */
    overrides_id?: string;
    title?: string;
    type?: string;
    category?: string;
    unit?: string;
    is_current?: boolean;
    progressive?: boolean;
    effective_date?: string;
    effective_from?: string;
    effective_to?: string;
    personal_relief?: string;
    regulatory_source?: string;
    description?: string;
    // Editor (GET /formulas/{id}) detail: bands + employee/employer split.
    items?: FormulaItem[];
    employee_percentage?: string;
    employer_percentage?: string;
    [key: string]: unknown;
}

export interface ReliefStatus {
    relief_type?: string;
    is_active?: boolean;
    amount?: string | number;
    effective_date?: string;
    [key: string]: unknown;
}

/** A KRA relief as the organisation sees it (platform relief with its own choice applied). */
export interface Relief {
    id: string;
    key: string;
    title: string;
    type?: string;
    is_active: boolean;
    statutory?: boolean;
    source: SettingSource;
    actual_amount?: boolean;
    fixed_limit?: string;
    percentage?: string;
    platform_id?: string;
}

const COMPONENTS = `${PS}/payroll-components`;

/** Build a category-scoped component CRUD (Earnings/Deductions/Benefits). */
function componentCrud(category: ComponentCategory) {
    return {
        list: (params?: ListParams) =>
            apiClient.get<Paginated<PayrollComponent> | PayrollComponent[]>(`${COMPONENTS}/`, {
                ...params,
                category
            }),
        get: (id: number | string) => apiClient.get<PayrollComponent>(`${COMPONENTS}/${id}/`),
        create: (data: Partial<PayrollComponent>) => apiClient.post<PayrollComponent>(`${COMPONENTS}/`, { ...data, category }),
        update: (id: number | string, data: Partial<PayrollComponent>) => apiClient.put<PayrollComponent>(`${COMPONENTS}/${id}/`, { ...data, category }),
        remove: (id: number | string) => apiClient.delete<void>(`${COMPONENTS}/${id}/`)
    };
}

export const earningsApi = componentCrud('Earnings');
export const deductionsApi = componentCrud('Deductions');
export const benefitsApi = componentCrud('Benefits');

export const componentsApi = {
    listAll: (params?: ListParams) => apiClient.get<Paginated<PayrollComponent> | PayrollComponent[]>(`${COMPONENTS}/`, params),
    /** Switch a component on or off for the organisation (opt-in items, statutory toggles, own). */
    setActive: (id: number | string, is_active: boolean) => apiClient.post<PayrollComponent>(`${COMPONENTS}/${id}/activation`, { is_active }),
    /** Drop the organisation's changes to a platform component. */
    revert: (id: number | string) => apiClient.post<PayrollComponent>(`${COMPONENTS}/${id}/revert`, {})
};

export const loansApi = {
    list: (params?: ListParams) => apiClient.get<Paginated<Loan> | Loan[]>(`${PS}/loans/`, params),
    get: (id: number | string) => apiClient.get<Loan>(`${PS}/loans/${id}/`),
    create: (data: Partial<Loan>) => apiClient.post<Loan>(`${PS}/loans/`, data),
    update: (id: number | string, data: Partial<Loan>) => apiClient.put<Loan>(`${PS}/loans/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${PS}/loans/${id}/`),
    recoveries: (id: string) => apiClient.get<{ results: LoanRecovery[]; count: number }>(`${PS}/loans/${id}/recoveries`)
};

export const loanTypesApi = {
    list: (params?: ListParams) => apiClient.get<Paginated<LoanType> | LoanType[]>(`${PS}/loan-types`, params),
    create: (data: Partial<LoanType>) => apiClient.post<LoanType>(`${PS}/loan-types`, data),
    update: (id: number | string, data: Partial<LoanType>) => apiClient.put<LoanType>(`${PS}/loan-types/${id}`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${PS}/loan-types/${id}`)
};

export const formulasApi = {
    list: (params?: ListParams) => apiClient.get<Paginated<Formula> | Formula[]>(`${PS}/formulas/`, params),
    get: (id: number | string) => apiClient.get<Formula>(`${PS}/formulas/${id}/`),
    create: (data: Partial<Formula>) => apiClient.post<Formula>(`${PS}/formulas/`, data),
    update: (id: number | string, data: Partial<Formula>) => apiClient.put<Formula>(`${PS}/formulas/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${PS}/formulas/${id}/`),
    byType: (type: string, params?: ListParams) => apiClient.get<Paginated<Formula> | Formula[]>(`${PS}/formulas/`, { ...params, type }),
    reliefStatus: (relief_type: string) => apiClient.get<ReliefStatus>(`${PS}/formulas/relief-status/`, { relief_type }),
    updateRelief: (data: { relief_type: string; is_active: boolean; effective_date?: string }) =>
        apiClient.post<ReliefStatus>(`${PS}/formula-management/`, {
            operation: 'update_relief',
            ...data
        }),
    revertRelief: (relief_type: string) => apiClient.post<ReliefStatus>(`${PS}/formula-management/`, { operation: 'revert_relief', relief_type }),
    reliefs: () => apiClient.get<{ results: Relief[]; count: number }>(`${PS}/formulas/reliefs`),
    /** Create this organisation's own copy of a platform formula (the only copy ever made). */
    customise: (id: number | string) => apiClient.post<Formula>(`${PS}/formulas/${id}/customise`, {}),
    /** Remove the organisation's own versions so the platform formula applies again. */
    revert: (id: number | string) => apiClient.post<{ removed: number }>(`${PS}/formulas/${id}/revert`, {})
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
    get: () => apiClient.get<GeneralHrSettings | GeneralHrSettings[] | Paginated<GeneralHrSettings>>(`${PS}/general-hr-settings/`),
    update: (id: number | string, data: Partial<GeneralHrSettings>) => apiClient.put<GeneralHrSettings>(`${PS}/general-hr-settings/${id}/`, data),
    create: (data: Partial<GeneralHrSettings>) => apiClient.post<GeneralHrSettings>(`${PS}/general-hr-settings/`, data)
};

/** Per diem policy (erp-api AppSetting hrm.per_diem_policy). Logistics raises per diem claims for
 * staff riders' trips against it; amounts are days x the job group rate, else daily_rate. */
export interface PerDiemPolicy {
    enabled: boolean;
    daily_rate: string;
    /** job group id (uuid) -> daily rate */
    job_group_rates?: Record<string, string>;
    min_distance_km: number;
    max_days?: number;
    auto_approve?: boolean;
}

export const perDiemPolicyApi = {
    get: () => apiClient.get<PerDiemPolicy>(`/hrm/payroll/per-diem-policy`),
    save: (data: PerDiemPolicy) => apiClient.put<PerDiemPolicy>(`/hrm/payroll/per-diem-policy`, data)
};
