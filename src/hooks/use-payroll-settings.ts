"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams, type Paginated } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  benefitsApi,
  deductionsApi,
  earningsApi,
  formulasApi,
  generalHrApi,
  loansApi,
  type Formula,
  type GeneralHrSettings,
  type Loan,
  type PayrollComponent,
} from "@/lib/api/payroll-settings";

interface CrudApi<T> {
  list: (params?: ListParams) => Promise<Paginated<T> | T[]>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: number | string, data: Partial<T>) => Promise<T>;
  remove: (id: number | string) => Promise<void>;
}

function makeCrudHooks<T extends { id: number }>(key: string, api: CrudApi<T>, label: string) {
  function useList(params?: ListParams) {
    return useQuery({ queryKey: [key, "list", params ?? {}], queryFn: () => api.list(params) });
  }
  function useSave() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id?: number | string; data: Partial<T> }) =>
        id ? api.update(id, data) : api.create(data),
      onSuccess: (_r, v) => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(v.id ? `${label} updated` : `${label} created`);
      },
      onError: (e) => toast.error(extractApiError(e, `Failed to save ${label.toLowerCase()}`)),
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
      onError: (e) => toast.error(extractApiError(e, `Failed to delete ${label.toLowerCase()}`)),
    });
  }
  return { useList, useSave, useRemove };
}

const earnings = makeCrudHooks<PayrollComponent>("pay-earnings", earningsApi, "Earning");
export const useEarnings = earnings.useList;
export const useSaveEarning = earnings.useSave;
export const useDeleteEarning = earnings.useRemove;

const deductions = makeCrudHooks<PayrollComponent>("pay-deductions", deductionsApi, "Deduction");
export const useDeductions = deductions.useList;
export const useSaveDeduction = deductions.useSave;
export const useDeleteDeduction = deductions.useRemove;

const benefits = makeCrudHooks<PayrollComponent>("pay-benefits", benefitsApi, "Benefit");
export const useBenefits = benefits.useList;
export const useSaveBenefit = benefits.useSave;
export const useDeleteBenefit = benefits.useRemove;

const loans = makeCrudHooks<Loan>("pay-loans", loansApi, "Loan");
export const useLoans = loans.useList;
export const useSaveLoan = loans.useSave;
export const useDeleteLoan = loans.useRemove;

const formulas = makeCrudHooks<Formula>("pay-formulas", formulasApi, "Formula");
export const useFormulas = formulas.useList;
export const useSaveFormula = formulas.useSave;
export const useDeleteFormula = formulas.useRemove;

// ---- General HR / statutory settings (singleton) ----
export function useGeneralHrSettings() {
  return useQuery({ queryKey: ["general-hr-settings"], queryFn: () => generalHrApi.get() });
}

export function useSaveGeneralHrSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<GeneralHrSettings> }) =>
      id ? generalHrApi.update(id, data) : generalHrApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-hr-settings"] });
      toast.success("Statutory settings saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save settings")),
  });
}
