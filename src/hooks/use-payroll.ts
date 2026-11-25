'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type ListParams } from '@/lib/api/drf';
import { extractApiError } from '@/lib/api/error';
import {
    type ConsultantVoucher,
    type DisburseCode,
    type DisburseResult,
    payrollApi,
    type RunTarget,
    type WhtRates,
    type CasualLabor,
    type Claim,
    type ClaimItem,
    type MileageRoute,
    type PayComponentRecord,
    type PayrollProcessPayload,
    type PayrollRunJob,
    type AttendanceDeductionStatus,
    type ProjectAllocation
} from '@/lib/api/payroll';
import { normalizeList } from '@/lib/api/drf';
import { approvalDecisionApi } from '@/lib/api/attendance-requests';

const KEY = 'payroll';

export function usePayrollRuns(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'runs', params ?? {}],
        queryFn: () => payrollApi.listRuns(params)
    });
}

export function usePayslip(id: number | string | undefined) {
    return useQuery({
        queryKey: [KEY, 'payslip', id],
        queryFn: () => payrollApi.getPayslip(id!),
        enabled: !!id
    });
}

export function usePayslips(params?: ListParams) {
    // Payslips are processed payroll records; reuse the runs endpoint with filters.
    return useQuery({
        queryKey: [KEY, 'payslips', params ?? {}],
        queryFn: () => payrollApi.listRuns(params)
    });
}

export function usePayrollEmployees(params?: ListParams, enabled = true) {
    return useQuery({
        queryKey: [KEY, 'employees', params ?? {}],
        queryFn: () => payrollApi.payrollEmployees(params),
        enabled
    });
}

export function usePayrollPreview() {
    return useMutation({
        mutationFn: (payload: PayrollProcessPayload) => payrollApi.preview(payload),
        onError: (e) => toast.error(extractApiError(e, 'Failed to generate preview'))
    });
}

export function useProcessPayroll() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: PayrollProcessPayload) => payrollApi.process(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Payroll run started');
        },
        onError: (e) => {
            if (activeRunFromError(e)) {
                toast.info('A payroll run is already in progress; following it');
                return;
            }
            toast.error(extractApiError(e, 'Failed to run payroll'));
        }
    });
}

/** The run already in progress, when starting another answered 409 run_in_progress. */
export function activeRunFromError(e: unknown): string | null {
    const res = (e as { response?: { status?: number; data?: { code?: string; task_id?: string } } })?.response;
    return res?.status === 409 && res.data?.code === 'run_in_progress' ? (res.data.task_id ?? null) : null;
}

/**
 * Follows a background payroll run live. The server streams progress over SSE in short
 * connections, so this reconnects until the run is done; after repeated stream failures it
 * falls back to reading the run every 2s. Pass null to stop.
 */
export function usePayrollRunProgress(runId: string | null) {
    const qc = useQueryClient();
    const [run, setRun] = useState<PayrollRunJob | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    // A new run (or none) starts from a clean slate; reset during render, not in the effect.
    const [trackedId, setTrackedId] = useState(runId);
    if (trackedId !== runId) {
        setTrackedId(runId);
        setRun(null);
        setStreamError(null);
    }

    useEffect(() => {
        if (!runId) return;
        const abort = new AbortController();
        let finished = false;
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const settle = (r: PayrollRunJob) => {
            setRun(r);
            if (r.status === 'completed' || r.status === 'failed') {
                finished = true;
                qc.invalidateQueries({ queryKey: [KEY] });
            }
        };
        (async () => {
            let failures = 0;
            while (!finished && !abort.signal.aborted) {
                try {
                    if (failures >= 3) {
                        settle(await payrollApi.getRunJob(runId));
                        await sleep(2000);
                        continue;
                    }
                    await payrollApi.streamRunJob(runId, (_event, r) => r && settle(r), abort.signal);
                    failures = 0;
                    setStreamError(null);
                } catch (e) {
                    if (abort.signal.aborted) return;
                    failures += 1;
                    if (failures >= 3) setStreamError(extractApiError(e, 'Live progress is unavailable; checking every few seconds'));
                    await sleep(1000);
                }
            }
        })();
        return () => abort.abort();
    }, [runId, qc]);

    return { run, streamError };
}

export function useAttendanceDeductions(params: { month: string; status?: AttendanceDeductionStatus; page?: number; limit?: number }) {
    return useQuery({
        queryKey: [KEY, 'attendance-deductions', params],
        queryFn: () => payrollApi.listAttendanceDeductions(params),
        enabled: !!params.month
    });
}

export function useComputeAttendanceDeductions() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (month: string) => payrollApi.computeAttendanceDeductions(month),
        onSuccess: (s) => {
            qc.invalidateQueries({ queryKey: [KEY, 'attendance-deductions'] });
            toast.success(`Attendance worked out: ${s.created} new, ${s.updated} updated, ${s.removed} removed` + (s.reviewed_kept ? `, ${s.reviewed_kept} already reviewed left as they were` : ''));
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to work out attendance deductions'))
    });
}

export function useReviewAttendanceDeductions() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: { ids: string[]; action: 'approve' | 'waive' | 'reopen'; note?: string }) => payrollApi.reviewAttendanceDeductions(body),
        onSuccess: (r, body) => {
            qc.invalidateQueries({ queryKey: [KEY, 'attendance-deductions'] });
            const verb = { approve: 'approved', waive: 'waived', reopen: 'reopened' }[body.action];
            toast.success(`${r.updated} deduction${r.updated === 1 ? '' : 's'} ${verb}`);
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update the deductions'))
    });
}

/** Where a period's run stands (approval, posting, payment) and which actions are open. */
export function usePayrollRunStatus(target: RunTarget | null) {
    return useQuery({
        queryKey: [KEY, 'run-status', target ?? {}],
        queryFn: () => payrollApi.runStatus(target as RunTarget),
        enabled: !!target?.payment_period
    });
}

// What each treasury refusal means for the person disbursing. Nothing was paid in any of these
// cases, and disbursing again sends the same batch, so no one is paid twice.
const DISBURSE_STOPS: Partial<Record<DisburseCode, { level: 'warning' | 'error'; text: string }>> = {
    approval_pending: {
        level: 'warning',
        text: 'Net pay is waiting for finance approval in Treasury. Once it is approved (with OTP), disburse again to release it.'
    },
    approval_rejected: {
        level: 'error',
        text: 'Finance rejected this payroll disbursement in Treasury. Nothing was paid. Resolve it with finance, then disburse again to request a new approval.'
    },
    approval_not_configured: {
        level: 'error',
        text: 'Treasury has no approval rule for payroll payouts, so this batch cannot be approved. Ask finance to set one up in Treasury, then disburse again.'
    },
    no_payout_account: {
        level: 'error',
        text: 'No payout account is connected in Treasury. Connect M-Pesa, Paystack or PayHero under Treasury Settings, Payments, then disburse again.'
    },
    duplicate_request: {
        level: 'warning',
        text: 'Treasury is still processing this batch. Wait a minute, then disburse again to see the result.'
    },
    not_configured: {
        level: 'error',
        text: 'Payroll is posted, but payouts are not connected to Treasury, so net pay was not sent.'
    }
};

/** The message for a disbursement Treasury refused, or undefined when it was not refused. */
export function disburseStop(data?: DisburseResult) {
    if (data?.disburse_code && DISBURSE_STOPS[data.disburse_code]) return DISBURSE_STOPS[data.disburse_code];
    // An older API without disburse_code.
    if (data?.pending_approval) return DISBURSE_STOPS.approval_pending;
    return undefined;
}

export function useDisbursePayroll() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: RunTarget) => payrollApi.disburse(payload),
        onSuccess: (data: DisburseResult) => {
            qc.invalidateQueries({ queryKey: [KEY] });
            const stop = disburseStop(data);
            if (stop) {
                toast[stop.level](stop.text, { duration: 10000 });
            } else if (data?.disburse_error) {
                toast.warning(`Payroll posted, ${data.paid ?? 0} of ${data.count ?? 0} paid: ${data.disburse_error}. Disburse again to retry the rest.`, {
                    duration: 8000
                });
            } else if (data?.already_done) {
                toast.success('This payroll is already fully paid');
            } else if (data?.disbursed) {
                toast.success('Payroll disbursed');
            } else {
                toast.info('Nothing to disburse for this period');
            }
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to disburse payroll'))
    });
}

/** Put a processed period up for approval, or send an unposted run back (reject). */
export function useSubmitPayrollApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reject, ...payload }: RunTarget & { reject?: boolean }) => (reject ? payrollApi.reject(payload) : payrollApi.submitApproval(payload)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success(v.reject ? 'Payroll sent back for correction' : 'Payroll submitted for approval');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update approval'))
    });
}

/** Approve or reject the run's request in the approvals engine. */
export function useDecidePayrollRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, approve, comment }: { requestId: string; approve: boolean; comment?: string }) => (approve ? approvalDecisionApi.approve(requestId, comment) : approvalDecisionApi.reject(requestId, comment ?? '')),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success(v.approve ? 'Payroll approved' : 'Payroll rejected');
        },
        onError: (e) => toast.error(extractApiError(e, 'Could not record the decision'))
    });
}

/** Reverse a posted batch whose net pay has not been sent. */
export function useReversePayroll() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: RunTarget) => payrollApi.reverse(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY] });
            toast.success('Payroll reversed. Correct the payslips and submit them for approval again.');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to reverse payroll'))
    });
}

export function useEmailPayslips() {
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => payrollApi.emailPayslips(data),
        onSuccess: () => toast.success('Payslips queued for delivery'),
        onError: (e) => toast.error(extractApiError(e, 'Failed to email payslips'))
    });
}

// ---- Claims ----
export function useClaims(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'claims', params ?? {}],
        queryFn: () => payrollApi.listClaims(params)
    });
}

export function useSaveClaim() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<Claim> }) => (id ? payrollApi.updateClaim(id, data) : payrollApi.createClaim(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
            toast.success(v.id ? 'Claim updated' : 'Claim created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save claim'))
    });
}

export function useDeleteClaim() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteClaim(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
            toast.success('Claim deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete claim'))
    });
}

type OverBudgetBody = {
    code?: string;
    budget?: { lines?: { budget_name?: string; line_name?: string; available?: string | number; action?: string }[] };
};

export function useApproveClaim() {
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: (vars: number | string | { id: number | string; override?: boolean }) => (typeof vars === 'object' ? payrollApi.approveClaim(vars.id, vars.override) : payrollApi.approveClaim(vars)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
            toast.success('Claim approved: reimbursement posted to finance');
        },
        onError: (e, vars) => {
            const res = (e as { response?: { status?: number; data?: OverBudgetBody } }).response;
            if (res?.status === 409 && res.data?.code === 'over_budget') {
                const id = typeof vars === 'object' ? vars.id : vars;
                const retried = typeof vars === 'object' && vars.override;
                const lines = (res.data.budget?.lines ?? [])
                    .filter((l) => l.action === 'stop')
                    .map((l) => `${l.budget_name}: ${l.line_name} (KES ${Math.round(Number(l.available ?? 0)).toLocaleString()} left)`)
                    .join('; ');
                if (retried) {
                    toast.error('Over budget: only an approver can approve this claim over budget.', { description: lines });
                    return;
                }
                toast.error('This claim would exceed a budget set to stop.', {
                    description: lines,
                    duration: 12000,
                    action: { label: 'Approve over budget', onClick: () => mutation.mutate({ id, override: true }) }
                });
                return;
            }
            toast.error(extractApiError(e, 'Failed to approve claim'));
        }
    });
    return mutation;
}

/** Single claim header (for the detail / edit page). */
export function useClaim(id: number | string | undefined) {
    return useQuery({
        queryKey: [KEY, 'claim', id],
        queryFn: () => payrollApi.getClaim(id!),
        enabled: !!id
    });
}

// ---- Claim line items (reimbursement / other) ----
export function useClaimItems(claimId: number | string | undefined) {
    return useQuery({
        queryKey: [KEY, 'claim-items', claimId],
        queryFn: async () => normalizeList<ClaimItem>(await payrollApi.listClaimItems(claimId!)).results,
        enabled: !!claimId
    });
}

export function useAddClaimItem(claimId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ClaimItem>) => payrollApi.createClaimItem(claimId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claim-items', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claim', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to add line'))
    });
}

export function useDeleteClaimItem(claimId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: number | string) => payrollApi.deleteClaimItem(claimId, itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claim-items', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claim', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to remove line'))
    });
}

// ---- Claim mileage routes (mileage) ----
export function useMileageRoutes(claimId: number | string | undefined) {
    return useQuery({
        queryKey: [KEY, 'claim-routes', claimId],
        queryFn: async () => normalizeList<MileageRoute>(await payrollApi.listMileageRoutes(claimId!)).results,
        enabled: !!claimId
    });
}

export function useAddMileageRoute(claimId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<MileageRoute>) => payrollApi.createMileageRoute(claimId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claim-routes', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claim', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to add route'))
    });
}

export function useDeleteMileageRoute(claimId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (routeId: number | string) => payrollApi.deleteMileageRoute(claimId, routeId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claim-routes', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claim', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to remove route'))
    });
}

// ---- Claim attachment upload (multipart) ----
export function useUploadClaimAttachment(claimId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => payrollApi.uploadClaimAttachment(claimId, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'claim', claimId] });
            qc.invalidateQueries({ queryKey: [KEY, 'claims'] });
            toast.success('Attachment uploaded');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to upload attachment'))
    });
}

// ---- Casual / subcontracted labour ----
export function useCasualLabor(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'casual-labor', params ?? {}],
        queryFn: () => payrollApi.listCasualLabor(params)
    });
}

export function useSaveCasualLabor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<CasualLabor> }) => (id ? payrollApi.updateCasualLabor(id, data) : payrollApi.createCasualLabor(data)),
        onSuccess: (v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'casual-labor'] });
            toast.success(v.id ? 'Record updated' : 'Record created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save record'))
    });
}

export function useApproveCasualLabor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.approveCasualLabor(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'casual-labor'] });
            toast.success('Approved — casual-labour cost posted to finance');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to approve'))
    });
}

export function useDeleteCasualLabor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteCasualLabor(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'casual-labor'] });
            toast.success('Record deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete'))
    });
}

// ---- Consultant WHT payment vouchers ----
export function useWhtRates() {
    return useQuery({ queryKey: [KEY, 'wht-rates'], queryFn: () => payrollApi.whtRates() });
}

export function useSaveWhtRates() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: WhtRates) => payrollApi.saveWhtRates(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'wht-rates'] });
            toast.success('Withholding tax rates saved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save the rates'))
    });
}

export function useConsultantVouchers(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'consultant-vouchers', params ?? {}],
        queryFn: () => payrollApi.listConsultantVouchers(params)
    });
}

export function useCreateConsultantVoucher() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ConsultantVoucher>) => payrollApi.createConsultantVoucher(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'consultant-vouchers'] });
            toast.success('Voucher created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to create voucher'))
    });
}

export function useApproveConsultantVoucher() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.approveConsultantVoucher(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'consultant-vouchers'] });
            toast.success('Approved — posted to finance and paid');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to approve'))
    });
}

export function useDeleteConsultantVoucher() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteConsultantVoucher(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'consultant-vouchers'] });
            toast.success('Voucher deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete'))
    });
}

export function useEmailConsultantVouchers() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { ids: (number | string)[]; message?: string }) => payrollApi.emailConsultantVouchers(data),
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: [KEY, 'consultant-vouchers'] });
            toast.success(`Queued ${r.queued} voucher email(s)`);
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to email vouchers'))
    });
}

// ---- Employee ↔ project allocations ----
export function useProjectAllocations(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'project-allocations', params ?? {}],
        queryFn: () => payrollApi.listAllocations(params)
    });
}

/** What a month's payroll applies to one employee. Always recomputed: pay, loans and switches change it. */
export function useEmployeePaySummary(employeeId: string, month?: string) {
    return useQuery({
        queryKey: [KEY, 'pay-summary', employeeId, month ?? 'current'],
        queryFn: () => payrollApi.employeePaySummary(employeeId, month),
        staleTime: 0,
        refetchOnMount: 'always'
    });
}

export function useSaveProjectAllocation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<ProjectAllocation> }) => (id ? payrollApi.updateAllocation(id, data) : payrollApi.createAllocation(data)),
        onSuccess: (v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'project-allocations'] });
            toast.success(v.id ? 'Allocation updated' : 'Allocation created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save allocation'))
    });
}

export function useDeleteProjectAllocation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteAllocation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'project-allocations'] });
            toast.success('Allocation deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete allocation'))
    });
}

// ---- Advances ----
export function useAdvances(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'advances', params ?? {}],
        queryFn: () => payrollApi.listAdvances(params)
    });
}

export function useSaveAdvance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<PayComponentRecord> }) => (id ? payrollApi.updateAdvance(id, data) : payrollApi.createAdvance(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'advances'] });
            toast.success(v.id ? 'Advance updated' : 'Advance created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save advance'))
    });
}

export function useDeleteAdvance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteAdvance(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'advances'] });
            toast.success('Advance deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete advance'))
    });
}

/** Approve (→ Scheduled) or disapprove (→ Disapproved) a salary advance. */
export function useSetAdvanceApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, approve }: { id: number | string; approve: boolean }) => (approve ? payrollApi.approveAdvance(id) : payrollApi.disapproveAdvance(id)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'advances'] });
            toast.success(v.approve ? 'Advance approved & scheduled' : 'Advance disapproved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update advance'))
    });
}

/** Salary advances as `{value,label}` options — used to link a casual-labour engagement to an
 * imprest/float advance (the advance the engaging employee drew to pay the casual worker). */
export function useAdvanceOptions() {
    const { data, isLoading } = useAdvances({ limit: 200 });
    const options = normalizeList<PayComponentRecord>(data).results.map((a) => ({
        value: String(a.id),
        label: `${a.employee_name || a.employee_id || 'Advance'} — ${a.amount ?? ''}`
    }));
    return { options, isLoading };
}

// ---- Losses & damages ----
export function useLossDamages(params?: ListParams) {
    return useQuery({
        queryKey: [KEY, 'losses', params ?? {}],
        queryFn: () => payrollApi.listLossDamages(params)
    });
}

export function useSaveLossDamage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number | string; data: Partial<PayComponentRecord> }) => (id ? payrollApi.updateLossDamage(id, data) : payrollApi.createLossDamage(data)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'losses'] });
            toast.success(v.id ? 'Record updated' : 'Record created');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to save record'))
    });
}

export function useDeleteLossDamage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => payrollApi.deleteLossDamage(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [KEY, 'losses'] });
            toast.success('Record deleted');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to delete record'))
    });
}

/** Approve (→ Scheduled) or disapprove (→ Disapproved) a loss/damage recovery. */
export function useSetLossDamageApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, approve }: { id: number | string; approve: boolean }) => (approve ? payrollApi.approveLossDamage(id) : payrollApi.disapproveLossDamage(id)),
        onSuccess: (_r, v) => {
            qc.invalidateQueries({ queryKey: [KEY, 'losses'] });
            toast.success(v.approve ? 'Recovery approved & scheduled' : 'Recovery disapproved');
        },
        onError: (e) => toast.error(extractApiError(e, 'Failed to update record'))
    });
}
