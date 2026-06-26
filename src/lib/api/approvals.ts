/**
 * ERP approval workflows (erp-api `/api/v1/approvals/workflows`).
 *
 * A workflow defines, per module, a named multi-step approval chain. The backend exposes
 * create / list / get / toggle-active / delete (there is no full-update endpoint, so the UI
 * "edit" recreates the workflow). Decisions on requests live under `/approvals/requests`.
 */
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/drf";

// Modules the ERP approval engine governs (mirrors approvalModules in the ent schema).
export const APPROVAL_MODULES = [
  { value: "payroll", label: "Payroll" },
  { value: "leave_request", label: "Leave Request" },
  { value: "contract", label: "Contract" },
  { value: "appraisal", label: "Appraisal" },
  { value: "performance_review", label: "Performance Review" },
  { value: "recruitment_offer", label: "Recruitment Offer" },
  { value: "general", label: "General" },
] as const;

// Approver resolution types (mirrors the backend resolveApprover switch).
export const APPROVER_TYPES = [
  { value: "manager", label: "Line Manager (reports-to)" },
  { value: "department_head", label: "Department Head" },
  { value: "role", label: "Role (RBAC)" },
  { value: "user", label: "Specific Employee" },
] as const;

export const moduleLabel = (m: string): string =>
  APPROVAL_MODULES.find((x) => x.value === m)?.label ?? m;
export const approverTypeLabel = (t: string): string =>
  APPROVER_TYPES.find((x) => x.value === t)?.label ?? t;

export interface ApprovalWorkflowStep {
  id?: string;
  sequence: number;
  name: string;
  approver_type: string;
  approver_role?: string;
  approver_employee_id?: string | null;
  is_optional?: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  tenant_id?: string;
  module: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // ent serializes edges under `edges.steps`.
  edges?: { steps?: ApprovalWorkflowStep[] };
}

export interface WorkflowPayload {
  module: string;
  name: string;
  description?: string;
  is_active?: boolean;
  steps: ApprovalWorkflowStep[];
}

const BASE = "/approvals/workflows";

export const erpApprovalsApi = {
  list: (module?: string) =>
    apiClient.get<Paginated<ApprovalWorkflow> | ApprovalWorkflow[]>(
      BASE,
      module ? { module } : undefined,
    ),
  get: (id: string) => apiClient.get<ApprovalWorkflow>(`${BASE}/${id}`),
  create: (data: WorkflowPayload) => apiClient.post<ApprovalWorkflow>(BASE, data),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<ApprovalWorkflow>(`${BASE}/${id}/active`, { is_active: isActive }),
  remove: (id: string) => apiClient.delete<void>(`${BASE}/${id}`),
};

/** Reads the steps off a workflow regardless of serialization shape. */
export function workflowSteps(wf: ApprovalWorkflow): ApprovalWorkflowStep[] {
  return wf.edges?.steps ?? [];
}
