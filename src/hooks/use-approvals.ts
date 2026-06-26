"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import {
  erpApprovalsApi,
  type ApprovalWorkflow,
  type WorkflowPayload,
} from "@/lib/api/approvals";

const KEY = ["approval-workflows"] as const;

export function useApprovalWorkflows(module?: string) {
  return useQuery({
    queryKey: [...KEY, module ?? "all"],
    queryFn: () => erpApprovalsApi.list(module),
  });
}

export function useCreateApprovalWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkflowPayload) => erpApprovalsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Approval workflow created");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });
}

export function useSetApprovalWorkflowActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      erpApprovalsApi.setActive(id, isActive),
    onSuccess: (wf: ApprovalWorkflow) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(wf.is_active ? "Workflow activated" : "Workflow deactivated");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });
}

export function useDeleteApprovalWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => erpApprovalsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Workflow deleted");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });
}
