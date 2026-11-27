'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { normalizeList, type ListParams, type Paginated } from '@/lib/api/drf';
import { extractApiError } from '@/lib/api/error';
import {
    benefitsApi,
    componentsApi,
    deductionsApi,
    earningsApi,
    employeeComponentsApi,
    type EmployeeComponentInput,
    formulasApi,
    generalHrApi,
    loansApi,
    loanTypesApi,
    levyBasesApi,
    type LevyRule,
    perDiemPolicyApi,
    type LoanType,
    type PerDiemPolicy,
    type Formula,
    type GeneralHrSettings,
    type Loan,
    type PayrollComponent
} from '@/lib/api/payroll-settings';

interface CrudApi<T> {
    list: (params?: ListParams) => Promise<Paginated<T> | T[]>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: number | string, data: Partial<T>) => Promise<T>;
    remove: (id: number | string) => Promise<void>;
}

function makeCrudHooks<T extends { id: number | string }>(key: string, api: CrudApi<T>, label: string) {
    function useList(params?: ListParams) {
        return useQuery({ queryKey: [key, 'list', params ?? {}], queryFn: () => api.list(params) });
    }
    function useSave() {
        const qc = useQueryClient();
        return useMutation({
            mutationFn: ({ id, data }: { id?: number | string; data: Partial<T> }) => (id ? api.update(id, data) : api.create(data)),
            onSuccess: (_r, v) => {
                qc.invalidateQueries({ queryKey: [key] });
                toast.success(v.id ? `${label} updated` : `${label} created`);
            },
            onError: (e) => toast.error(extractApiError(e, `Failed to save ${label.toLowerCase()}`))
        });
    }
    function useRemove() {
        const qc = useQueryClient();
        return useMutation({
            mutationFn: (id: number | string) => api.remove(id),
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: [key] });
                toast.success(`${label} deleted`);
            },
            onError: (e) => toast.error(extractApiError(e, `Failed to delete ${label.toLowerCase()}`))
        });
    }
    return { useList, useSave, useRemove };
}

const earnings = makeCrudHooks<PayrollComponent>('pay-earnings', earningsApi, 'Earning');
export const useEarnings = earnings.useList;
export const useSaveEarning = earnings.useSave;
export const useDeleteEarning = earnings.useRemove;

const deductions = makeCrudHooks<PayrollComponent>('pay-deductions', deductionsApi, 'Deduction');
export const useDeductions = deductions.useList;
export const useSaveDeduction = deductions.useSave;
export const useDeleteDeduction = deductions.useRemove;

const benefits = makeCrudHooks<PayrollComponent>('pay-benefits', benefitsApi, 'Benefit');
export const useBenefits = benefits.useList;
export const useSaveBenefit = benefits.useSave;
export const useDeleteBenefit = benefits.useRemove;

const loans = makeCrudHooks<Loan>('pay-loans', loansApi, 'Loan');
export const useLoans = loans.useList;
export const useSaveLoan = loans.useSave;
export const useDeleteLoan = loans.useRemove;

/** Payroll recoveries of one employee loan. */
export function useLoanRecoveries(id: string | null) {
    return useQuery({
        queryKey: ['pay-loans', 'recoveries', id],
        queryFn: () => loansApi.recoveries(id as string),
        enabled: !!id
    });
}

const loanTypes = makeCrudHooks<LoanType>('pay-loan-types', loanTypesApi, 'Loan type');
export const useLoanTypes = loanTypes.useList;
export const useSaveLoanType = loanTypes.useSave;
export const useDeleteLoanType = loanTypes.useRemove;

const formulas = makeCrudHooks<Formula>('pay-formulas', formulasApi, 'Formula');
export const useFormulas = formulas.useList;
export const useSaveFormula = formulas.useSave;
export const useDeleteFormula = formulas.useRemove;

/** Full formula detail (bands + split) for the band/tier editor. */
export function useFormula(id: string | null) {
    return useQuery({
        queryKey: ['pay-formula', id],
        queryFn: () => formulasApi.get(id!),
        enabled: !!id && id !== 'new'
    });
}

/** Create/update a formula WITH its bands + split (editor save). */
export function useSaveFormulaDetail() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: string; data: Partial<Formula> }) => (id && id !== 'new' ? formulasApi.update(id, data) : formulasApi.create(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: ['pay-formulas'] });
            qc.invalidateQueries({ queryKey: ['pay-formula', v.id] });
            toast.success(v.id && v.id !== 'new' ? 'Formula updated' : 'Formula created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save formula'))
    });
}

// ---- Platform defaults: switch on/off, customise, revert ----

const COMPONENT_KEYS = ['pay-components', 'pay-earnings', 'pay-deductions', 'pay-benefits', 'employee-components'];

/** Switch a payroll component on or off for the organisation. */
export function useSetComponentActive() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, active }: { id: number | string; active: boolean }) => componentsApi.setActive(id, active),
        onSuccess: (_r, v) => {
            COMPONENT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
            qc.invalidateQueries({ queryKey: ['general-hr-settings'] });
            toast.success(v.active ? 'Component switched on' : 'Component switched off');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to change the component'))
    });
}

/** Drop the organisation's changes to a platform component. */
export function useRevertComponent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => componentsApi.revert(id),
        onSuccess: () => {
            COMPONENT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
            qc.invalidateQueries({ queryKey: ['general-hr-settings'] });
            toast.success('Platform default restored');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to restore the platform default'))
    });
}

/** Make the organisation's own copy of a platform formula. Resolves to the new formula. */
export function useCustomiseFormula() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => formulasApi.customise(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pay-formulas'] });
            toast.success('Your organisation now has its own copy of this formula');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to customise the formula'))
    });
}

/** Remove the organisation's versions of a formula so the platform default applies again. */
export function useRevertFormula() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => formulasApi.revert(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pay-formulas'] });
            qc.invalidateQueries({ queryKey: ['pay-formula'] });
            toast.success('Platform formula restored');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to restore the platform formula'))
    });
}

/** Every KRA relief the organisation has, with its on/off state and source. */
export function useReliefs() {
    return useQuery({ queryKey: ['pay-relief', 'all'], queryFn: () => formulasApi.reliefs() });
}

export function useRevertRelief() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reliefType: string) => formulasApi.revertRelief(reliefType),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pay-relief'] });
            toast.success('Platform relief restored');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to restore the relief'))
    });
}

// ---- Tax relief management (formulas/relief-status + formula-management) ----
export function useReliefStatus(reliefType: string | null) {
    return useQuery({
        queryKey: ['pay-relief', reliefType],
        queryFn: () => formulasApi.reliefStatus(reliefType!),
        enabled: !!reliefType
    });
}

export function useUpdateRelief() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { relief_type: string; is_active: boolean; effective_date?: string }) => formulasApi.updateRelief(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pay-relief'] });
            toast.success('Tax relief updated');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update relief'))
    });
}

// ---- General HR / statutory settings (singleton) ----
export function useGeneralHrSettings() {
    return useQuery({ queryKey: ['general-hr-settings'], queryFn: () => generalHrApi.get() });
}

/** Resolve the general-hr-settings response (list envelope or plain object) to the singleton. */
export function generalHrSingleton(data: unknown): GeneralHrSettings | undefined {
    if (Array.isArray(data) || (data && typeof data === 'object' && 'results' in (data as object))) {
        return normalizeList<GeneralHrSettings>(data as never).results[0];
    }
    return (data as GeneralHrSettings) || undefined;
}

/**
 * Tenant statutory deduction toggles (Settings → Payroll → Statutory). Missing settings or
 * a still-loading query read as all-enabled — the engine's default — so nothing is hidden
 * prematurely.
 */
export function useStatutoryToggles() {
    const { data } = useGeneralHrSettings();
    const s = generalHrSingleton(data);
    return {
        paye: s?.paye_enabled !== false,
        nssf: s?.nssf_enabled !== false,
        shif: s?.shif_enabled !== false,
        housingLevy: s?.housing_levy_enabled !== false,
        nita: s?.nita_enabled !== false
    };
}

export function useSaveGeneralHrSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<GeneralHrSettings> }) => (id ? generalHrApi.update(id, data) : generalHrApi.create(data)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['general-hr-settings'] });
            toast.success('Statutory settings saved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save settings'))
    });
}

export function useLevyBases() {
    return useQuery({ queryKey: ['levy-bases'], queryFn: () => levyBasesApi.list() });
}

export function useSetLevyRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ code, rule }: { code: string; rule: LevyRule }) => levyBasesApi.set(code, rule),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['levy-bases'] });
            toast.success('Levy rule saved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save the levy rule'))
    });
}

export function useCancelLevyRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ code, from }: { code: string; from: string }) => levyBasesApi.cancel(code, from),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['levy-bases'] });
            toast.success('Levy rule cancelled');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to cancel the levy rule'))
    });
}

export function usePerDiemPolicy() {
    return useQuery({ queryKey: ['per-diem-policy'], queryFn: () => perDiemPolicyApi.get() });
}

export function useSavePerDiemPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: PerDiemPolicy) => perDiemPolicyApi.save(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['per-diem-policy'] });
            toast.success('Per diem policy saved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save the per diem policy'))
    });
}

/** Earnings, deductions and benefits given to one employee. */
export function useEmployeeComponents(employeeId: number | string | undefined) {
    return useQuery({
        queryKey: ['employee-components', employeeId],
        queryFn: () => employeeComponentsApi.list(employeeId!),
        enabled: !!employeeId
    });
}

export function useSaveEmployeeComponent(employeeId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: string; data: EmployeeComponentInput }) => (id ? employeeComponentsApi.update(employeeId, id, data) : employeeComponentsApi.create(employeeId, data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: ['employee-components', employeeId] });
            qc.invalidateQueries({ queryKey: ['payroll', 'pay-summary', employeeId] });
            toast.success(v.id ? 'Assignment updated' : 'Assigned to the employee');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save the assignment'))
    });
}

export function useDeleteEmployeeComponent(employeeId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeeComponentsApi.remove(employeeId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employee-components', employeeId] });
            qc.invalidateQueries({ queryKey: ['payroll', 'pay-summary', employeeId] });
            toast.success('Assignment removed');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to remove the assignment'))
    });
}

/** The organisation's switched-on components that can be given to employees one by one. */
export function useAssignableComponents() {
    return useQuery({
        queryKey: ['pay-components', 'assignable'],
        queryFn: () => componentsApi.listAll({ active: 'true', limit: 200 }),
        select: (data) => normalizeList<PayrollComponent>(data).results.filter((c) => c.assignable)
    });
}
