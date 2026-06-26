"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  payrollApi,
  type CasualLabor,
  type Claim,
  type PayComponentRecord,
  type PayrollProcessPayload,
} from "@/lib/api/payroll";

const KEY = "payroll";

export function usePayrollRuns(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "runs", params ?? {}],
    queryFn: () => payrollApi.listRuns(params),
  });
}

export function usePayslip(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "payslip", id],
    queryFn: () => payrollApi.getPayslip(id!),
    enabled: !!id,
  });
}

export function usePayslips(params?: ListParams) {
  // Payslips are processed payroll records; reuse the runs endpoint with filters.
  return useQuery({
    queryKey: [KEY, "payslips", params ?? {}],
    queryFn: () => payrollApi.listRuns(params),
  });
}

export function usePayrollEmployees(params?: ListParams, enabled = true) {
  return useQuery({
    queryKey: [KEY, "employees", params ?? {}],
    queryFn: () => payrollApi.payrollEmployees(params),
    enabled,
  });
}

export function usePayrollPreview() {
  return useMutation({
    mutationFn: (payload: PayrollProcessPayload) => payrollApi.preview(payload),
    onError: (e) => toast.error(extractApiError(e, "Failed to generate preview")),
  });
}

export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayrollProcessPayload) => payrollApi.process(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Payroll run started");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to run payroll")),
  });
}

export function useDisbursePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { payment_period?: string; from_date?: string; to_date?: string; run_id?: number }) =>
      payrollApi.disburse(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Payroll disbursed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to disburse payroll")),
  });
}

export function useEmailPayslips() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => payrollApi.emailPayslips(data),
    onSuccess: () => toast.success("Payslips queued for delivery"),
    onError: (e) => toast.error(extractApiError(e, "Failed to email payslips")),
  });
}

// ---- Claims ----
export function useClaims(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "claims", params ?? {}],
    queryFn: () => payrollApi.listClaims(params),
  });
}

export function useSaveClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<Claim> }) =>
      id ? payrollApi.updateClaim(id, data) : payrollApi.createClaim(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
      toast.success(v.id ? "Claim updated" : "Claim created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save claim")),
  });
}

export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.deleteClaim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
      toast.success("Claim deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete claim")),
  });
}

export function useApproveClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.approveClaim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
      toast.success("Claim approved — reimbursement posted to finance");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to approve claim")),
  });
}

// ---- Casual / subcontracted labour ----
export function useCasualLabor(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "casual-labor", params ?? {}],
    queryFn: () => payrollApi.listCasualLabor(params),
  });
}

export function useSaveCasualLabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<CasualLabor> }) =>
      id ? payrollApi.updateCasualLabor(id, data) : payrollApi.createCasualLabor(data),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: [KEY, "casual-labor"] });
      toast.success(v.id ? "Record updated" : "Record created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save record")),
  });
}

export function useApproveCasualLabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.approveCasualLabor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "casual-labor"] });
      toast.success("Approved — casual-labour cost posted to finance");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to approve")),
  });
}

export function useDeleteCasualLabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.deleteCasualLabor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "casual-labor"] });
      toast.success("Record deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete")),
  });
}

// ---- Advances ----
export function useAdvances(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "advances", params ?? {}],
    queryFn: () => payrollApi.listAdvances(params),
  });
}

export function useSaveAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<PayComponentRecord> }) =>
      id ? payrollApi.updateAdvance(id, data) : payrollApi.createAdvance(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "advances"] });
      toast.success(v.id ? "Advance updated" : "Advance created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save advance")),
  });
}

export function useDeleteAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.deleteAdvance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "advances"] });
      toast.success("Advance deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete advance")),
  });
}

// ---- Losses & damages ----
export function useLossDamages(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "losses", params ?? {}],
    queryFn: () => payrollApi.listLossDamages(params),
  });
}

export function useSaveLossDamage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<PayComponentRecord> }) =>
      id ? payrollApi.updateLossDamage(id, data) : payrollApi.createLossDamage(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "losses"] });
      toast.success(v.id ? "Record updated" : "Record created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save record")),
  });
}

export function useDeleteLossDamage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.deleteLossDamage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "losses"] });
      toast.success("Record deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete record")),
  });
}
