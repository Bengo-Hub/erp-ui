"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  payrollApi,
  type CasualLabor,
  type Claim,
  type ClaimItem,
  type MileageRoute,
  type PayComponentRecord,
  type PayrollProcessPayload,
  type ProjectAllocation,
} from "@/lib/api/payroll";
import { normalizeList } from "@/lib/api/drf";

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

/** Approve or reject a processed period (review step before disburse). */
export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approve, ...payload }: { approve: boolean; payment_period?: string; outlet_id?: string }) =>
      approve ? payrollApi.approve(payload) : payrollApi.reject(payload),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(v.approve ? "Payroll approved" : "Payroll rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update approval")),
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

/** Single claim header (for the detail / edit page). */
export function useClaim(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "claim", id],
    queryFn: () => payrollApi.getClaim(id!),
    enabled: !!id,
  });
}

// ---- Claim line items (reimbursement / other) ----
export function useClaimItems(claimId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "claim-items", claimId],
    queryFn: async () => normalizeList<ClaimItem>(await payrollApi.listClaimItems(claimId!)).results,
    enabled: !!claimId,
  });
}

export function useAddClaimItem(claimId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClaimItem>) => payrollApi.createClaimItem(claimId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claim-items", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claim", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to add line")),
  });
}

export function useDeleteClaimItem(claimId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number | string) => payrollApi.deleteClaimItem(claimId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claim-items", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claim", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove line")),
  });
}

// ---- Claim mileage routes (mileage) ----
export function useMileageRoutes(claimId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "claim-routes", claimId],
    queryFn: async () =>
      normalizeList<MileageRoute>(await payrollApi.listMileageRoutes(claimId!)).results,
    enabled: !!claimId,
  });
}

export function useAddMileageRoute(claimId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MileageRoute>) => payrollApi.createMileageRoute(claimId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claim-routes", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claim", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to add route")),
  });
}

export function useDeleteMileageRoute(claimId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: number | string) => payrollApi.deleteMileageRoute(claimId, routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claim-routes", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claim", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove route")),
  });
}

// ---- Claim attachment upload (multipart) ----
export function useUploadClaimAttachment(claimId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => payrollApi.uploadClaimAttachment(claimId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "claim", claimId] });
      qc.invalidateQueries({ queryKey: [KEY, "claims"] });
      toast.success("Attachment uploaded");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to upload attachment")),
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

// ---- Employee ↔ project allocations ----
export function useProjectAllocations(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "project-allocations", params ?? {}],
    queryFn: () => payrollApi.listAllocations(params),
  });
}

export function useSaveProjectAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<ProjectAllocation> }) =>
      id ? payrollApi.updateAllocation(id, data) : payrollApi.createAllocation(data),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: [KEY, "project-allocations"] });
      toast.success(v.id ? "Allocation updated" : "Allocation created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save allocation")),
  });
}

export function useDeleteProjectAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => payrollApi.deleteAllocation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "project-allocations"] });
      toast.success("Allocation deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete allocation")),
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

/** Approve (→ Scheduled) or disapprove (→ Disapproved) a salary advance. */
export function useSetAdvanceApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: number | string; approve: boolean }) =>
      approve ? payrollApi.approveAdvance(id) : payrollApi.disapproveAdvance(id),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "advances"] });
      toast.success(v.approve ? "Advance approved & scheduled" : "Advance disapproved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update advance")),
  });
}

/** Salary advances as `{value,label}` options — used to link a casual-labour engagement to an
 * imprest/float advance (the advance the engaging employee drew to pay the casual worker). */
export function useAdvanceOptions() {
  const { data, isLoading } = useAdvances({ limit: 200 });
  const options = normalizeList<PayComponentRecord>(data).results.map((a) => ({
    value: String(a.id),
    label: `${a.employee_name || a.employee_id || "Advance"} — ${a.amount ?? ""}`,
  }));
  return { options, isLoading };
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

/** Approve (→ Scheduled) or disapprove (→ Disapproved) a loss/damage recovery. */
export function useSetLossDamageApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: number | string; approve: boolean }) =>
      approve ? payrollApi.approveLossDamage(id) : payrollApi.disapproveLossDamage(id),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "losses"] });
      toast.success(v.approve ? "Recovery approved & scheduled" : "Recovery disapproved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update record")),
  });
}
