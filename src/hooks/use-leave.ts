"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  leaveApi,
  type LeaveBalance,
  type LeaveCategory,
  type LeaveEntitlement,
  type LeaveRequest,
} from "@/lib/api/leave";
import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";

const KEY = "leave";

// ---- Requests ----
export function useLeaveRequests(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "requests", params ?? {}],
    queryFn: () => leaveApi.listRequests(params),
  });
}

export function useLeaveRequest(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "request", id],
    queryFn: () => leaveApi.getRequest(id!),
    enabled: !!id,
  });
}

export function useSaveLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveRequest> }) =>
      id ? leaveApi.updateRequest(id, data) : leaveApi.createRequest(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(v.id ? "Leave request updated" : "Leave request submitted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to submit leave request")),
  });
}

export function useDeleteLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => leaveApi.deleteRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "requests"] });
      toast.success("Leave request deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete leave request")),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => leaveApi.approveRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Leave request approved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to approve leave")),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      leaveApi.rejectRequest(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Leave request rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to reject leave")),
  });
}

// ---- Categories (types) ----
export function useLeaveCategories(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "categories", params ?? {}],
    queryFn: () => leaveApi.listCategories(params),
  });
}

export function useSaveLeaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveCategory> }) =>
      id ? leaveApi.updateCategory(id, data) : leaveApi.createCategory(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "categories"] });
      toast.success(v.id ? "Leave type updated" : "Leave type created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save leave type")),
  });
}

export function useDeleteLeaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => leaveApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "categories"] });
      toast.success("Leave type deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete leave type")),
  });
}

// ---- Balances ----
export function useLeaveBalances(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "balances", params ?? {}],
    queryFn: () => leaveApi.listBalances(params),
  });
}

export function useSaveLeaveBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveBalance> }) =>
      id ? leaveApi.updateBalance(id, data) : leaveApi.createBalance(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "balances"] });
      toast.success(v.id ? "Balance updated" : "Balance created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save balance")),
  });
}

export function useDeleteLeaveBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => leaveApi.deleteBalance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "balances"] });
      toast.success("Balance deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete balance")),
  });
}

/** Manually run leave accrual for the year (POST /leave/accrue) — the cron does this daily. */
export function useAccrueLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year?: number) => leaveApi.accrue(year ? { year } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "balances"] });
      toast.success("Leave accrual run");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to run accrual")),
  });
}

// ---- Entitlements ----
export function useLeaveEntitlements(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "entitlements", params ?? {}],
    queryFn: () => leaveApi.listEntitlements(params),
  });
}

export function useSaveLeaveEntitlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveEntitlement> }) =>
      id ? leaveApi.updateEntitlement(id, data) : leaveApi.createEntitlement(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY, "entitlements"] });
      toast.success(v.id ? "Entitlement updated" : "Entitlement created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save entitlement")),
  });
}

export function useDeleteLeaveEntitlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => leaveApi.deleteEntitlement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "entitlements"] });
      toast.success("Entitlement deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete entitlement")),
  });
}

// ---- Logs ----
export function useLeaveLogs(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "logs", params ?? {}],
    queryFn: () => leaveApi.listLogs(params),
  });
}
