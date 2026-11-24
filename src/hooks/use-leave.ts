'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { leaveApi, type LeaveBalance, type LeaveCategory, type LeaveCountMode, type LeaveEntitlement, type LeavePreviewParams, type LeaveRequest, type PublicHoliday } from '@/lib/api/leave';
import { type ListParams } from '@/lib/api/drf';
import { extractApiError } from '@/lib/api/error';
import { makeResourceHooks } from '@/hooks/use-crud-resource';

const KEY = 'leave';

// ---- Requests ----
export function useLeaveRequests(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'requests', params ?? {}],
        queryFn: ({ signal }) => leaveApi.listRequests(params, signal),
        // Keep the current rows on screen while the next search term or page loads.
        placeholderData: (prev) => prev
    });
}

export function useLeaveRequest(id: number | string | undefined) {
    return useQuery({
        queryKey: [KEY, 'request', id],
        queryFn: () => leaveApi.getRequest(id!),
        enabled: !!id
    });
}

export function useSaveLeaveRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveRequest> }) => (id ? leaveApi.updateRequest(id, data) : leaveApi.createRequest(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success(v.id ? 'Leave request updated' : 'Leave request submitted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to submit leave request'))
    });
}

export function useDeleteLeaveRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.deleteRequest(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'requests'] });
            toast.success('Leave request deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete leave request'))
    });
}

/** The day count for a request being filled in; null params (an incomplete form) ask nothing. */
export function useLeavePreview(params: LeavePreviewParams | null) {
    return useQuery({
        queryKey: [KEY, 'preview', params],
        queryFn: ({ signal }) => leaveApi.previewRequest(params!, signal),
        enabled: !!params,
        retry: false
    });
}

export function useCancelLeave() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.cancelRequest(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Leave request cancelled');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to cancel leave request'))
    });
}

export function useSetLeaveCountMode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, mode }: { id: number | string; mode: LeaveCountMode }) => leaveApi.setCountMode(id, mode),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Day counting updated');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update day counting'))
    });
}

export function useApproveLeave() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.approveRequest(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Leave request approved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to approve leave'))
    });
}

export function useRejectLeave() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number | string; reason: string }) => leaveApi.rejectRequest(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Leave request rejected');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to reject leave'))
    });
}

// ---- Categories (types) ----
export function useLeaveCategories(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'categories', params ?? {}],
        queryFn: () => leaveApi.listCategories(params)
    });
}

export function useSaveLeaveCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveCategory> }) => (id ? leaveApi.updateCategory(id, data) : leaveApi.createCategory(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'categories'] });
            toast.success(v.id ? 'Leave type updated' : 'Leave type created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save leave type'))
    });
}

export function useDeleteLeaveCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.deleteCategory(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'categories'] });
            toast.success('Leave type deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete leave type'))
    });
}

// ---- Balances ----
export function useLeaveBalances(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'balances', params ?? {}],
        queryFn: ({ signal }) => leaveApi.listBalances(params, signal),
        // Keep the current rows on screen while the next search term or page loads.
        placeholderData: (prev) => prev
    });
}

export function useSaveLeaveBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveBalance> }) => (id ? leaveApi.updateBalance(id, data) : leaveApi.createBalance(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'balances'] });
            toast.success(v.id ? 'Balance updated' : 'Balance created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save balance'))
    });
}

export function useDeleteLeaveBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.deleteBalance(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'balances'] });
            toast.success('Balance deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete balance'))
    });
}

/** Manually run leave accrual for the year (POST /leave/accrue) — the cron does this daily. */
export function useAccrueLeave() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (year?: number) => leaveApi.accrue(year ? { year } : undefined),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'balances'] });
            toast.success('Leave accrual run');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to run accrual'))
    });
}

// ---- Entitlements ----
export function useLeaveEntitlements(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'entitlements', params ?? {}],
        queryFn: () => leaveApi.listEntitlements(params)
    });
}

export function useSaveLeaveEntitlement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<LeaveEntitlement> }) => (id ? leaveApi.updateEntitlement(id, data) : leaveApi.createEntitlement(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'entitlements'] });
            toast.success(v.id ? 'Entitlement updated' : 'Entitlement created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save entitlement'))
    });
}

export function useDeleteLeaveEntitlement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => leaveApi.deleteEntitlement(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'entitlements'] });
            toast.success('Entitlement deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete entitlement'))
    });
}

// ---- Logs ----
export function useLeaveLogs(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'logs', params ?? {}],
        queryFn: ({ signal }) => leaveApi.listLogs(params, signal),
        // Keep the current rows on screen while the next search term or page loads.
        placeholderData: (prev) => prev
    });
}

// ---- Public holidays ----
const holidays = makeResourceHooks<PublicHoliday>('public-holidays', leaveApi.holidays, 'Public holiday');
export const usePublicHolidays = holidays.useList;
export const useSavePublicHoliday = holidays.useSave;
export const useDeletePublicHoliday = holidays.useRemove;
