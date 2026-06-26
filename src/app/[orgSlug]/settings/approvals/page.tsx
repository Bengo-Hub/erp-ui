"use client";

import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  useApprovalWorkflows,
  useCreateApprovalWorkflow,
  useDeleteApprovalWorkflow,
  useSetApprovalWorkflowActive,
} from "@/hooks/use-approvals";
import {
  APPROVAL_MODULES,
  APPROVER_TYPES,
  approverTypeLabel,
  moduleLabel,
  workflowSteps,
  type ApprovalWorkflow,
  type ApprovalWorkflowStep,
} from "@/lib/api/approvals";
import { normalizeList } from "@/lib/api/drf";

import { SettingsTabs } from "../_tabs";

interface StepDraft {
  name: string;
  approver_type: string;
  approver_role: string;
}

const DEFAULT_STEP: StepDraft = { name: "Manager sign-off", approver_type: "manager", approver_role: "" };

/**
 * Approval Rules — manage per-module multi-step approval workflows (payroll, leave, contracts,
 * etc.). Mirrors the treasury approval-rules page. The ERP backend has no full-update endpoint,
 * so "edit" recreates the workflow (delete + create) atomically from the UI's perspective.
 */
export default function ApprovalRulesPage() {
  const { data, isLoading, error, refetch } = useApprovalWorkflows();
  const createWf = useCreateApprovalWorkflow();
  const setActive = useSetApprovalWorkflowActive();
  const deleteWf = useDeleteApprovalWorkflow();

  const rows = normalizeList<ApprovalWorkflow>(data).results;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalWorkflow | null>(null);
  const [toDelete, setToDelete] = useState<ApprovalWorkflow | null>(null);

  const [module, setModule] = useState<string>("payroll");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<StepDraft[]>([DEFAULT_STEP]);

  function resetForm() {
    setModule("payroll");
    setName("");
    setDescription("");
    setIsActive(true);
    setSteps([DEFAULT_STEP]);
  }

  function startCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function startEdit(wf: ApprovalWorkflow) {
    setEditing(wf);
    setModule(wf.module);
    setName(wf.name);
    setDescription(wf.description ?? "");
    setIsActive(wf.is_active);
    const s = workflowSteps(wf);
    setSteps(
      s.length
        ? s.map((st) => ({
            name: st.name,
            approver_type: st.approver_type,
            approver_role: st.approver_role ?? "",
          }))
        : [DEFAULT_STEP],
    );
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditing(null);
    resetForm();
  }

  function addStep() {
    setSteps([...steps, { name: "", approver_type: "manager", approver_role: "" }]);
  }
  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx));
  }
  function updateStep(idx: number, field: keyof StepDraft, value: string) {
    const next = [...steps];
    next[idx] = { ...next[idx], [field]: value };
    setSteps(next);
  }

  const saving = createWf.isPending || deleteWf.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanSteps: ApprovalWorkflowStep[] = steps
      .filter((s) => s.approver_type)
      .map((s, i) => ({
        sequence: i + 1,
        name: s.name.trim() || `Step ${i + 1}`,
        approver_type: s.approver_type,
        approver_role: s.approver_type === "role" ? s.approver_role.trim() : "",
      }));
    if (cleanSteps.length === 0) return;

    const payload = {
      module,
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
      steps: cleanSteps,
    };

    // No full-update endpoint: edit = delete old + create new.
    const doCreate = () => createWf.mutate(payload, { onSuccess: closeDialog });
    if (editing) {
      deleteWf.mutate(editing.id, { onSuccess: doCreate });
    } else {
      doCreate();
    }
  }

  const columns: Column<ApprovalWorkflow>[] = [
    { header: "Workflow", cell: (wf) => <span className="font-medium">{wf.name}</span> },
    { header: "Module", cell: (wf) => moduleLabel(wf.module) },
    {
      header: "Steps",
      cell: (wf) => (
        <div className="flex flex-wrap gap-1">
          {workflowSteps(wf).map((s) => (
            <Badge key={s.id ?? s.sequence} variant="outline">
              {s.sequence}. {s.approver_type === "role" && s.approver_role ? s.approver_role : approverTypeLabel(s.approver_type)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Active",
      cell: (wf) => (
        <PermissionGate permission="approvals.manage" fallback={<Badge variant={wf.is_active ? "success" : "outline"}>{wf.is_active ? "Active" : "Inactive"}</Badge>}>
          <Switch
            checked={wf.is_active}
            onChange={(v: boolean) => setActive.mutate({ id: wf.id, isActive: v })}
            disabled={setActive.isPending}
            id={`active-${wf.id}`}
          />
        </PermissionGate>
      ),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (wf) => (
        <PermissionGate permission="approvals.manage">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => startEdit(wf)}>
              Edit
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete workflow" onClick={() => setToDelete(wf)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Approval Rules"
        subtitle="Multi-step approval workflows for payroll, leave, contracts and more"
        actions={
          <PermissionGate permission="approvals.manage">
            <Button size="sm" onClick={startCreate}>
              <Plus className="mr-1 size-4" /> New Workflow
            </Button>
          </PermissionGate>
        }
      />
      <SettingsTabs active="approvals" />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(wf) => wf.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No approval workflows"
          emptyDescription="Add a workflow to require multi-step sign-off before an action proceeds."
        />
      </Card>

      <Dialog open={open} onClose={closeDialog} title={editing ? "Edit Approval Workflow" : "New Approval Workflow"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Module" htmlFor="wf-module" required>
              <Select id="wf-module" value={module} onChange={(e) => setModule(e.target.value)}>
                {APPROVAL_MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name" htmlFor="wf-name" required>
              <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard payroll sign-off" required />
            </Field>
          </div>

          <Field label="Description" htmlFor="wf-desc">
            <Textarea id="wf-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional" />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isActive} onChange={setIsActive} id="wf-active" />
            Active
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Approval Steps (in order)</span>
              <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                <Plus className="mr-1 size-3" /> Add Step
              </Button>
            </div>
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">{idx + 1}</span>
                <Input
                  value={step.name}
                  onChange={(e) => updateStep(idx, "name", e.target.value)}
                  placeholder="Step label"
                  className="flex-1"
                />
                <Select value={step.approver_type} onChange={(e) => updateStep(idx, "approver_type", e.target.value)} className="w-44">
                  {APPROVER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                {step.approver_type === "role" && (
                  <Input
                    value={step.approver_role}
                    onChange={(e) => updateStep(idx, "approver_role", e.target.value)}
                    placeholder="Role name"
                    className="w-32"
                  />
                )}
                {steps.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeStep(idx)}>
                    <Minus className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Workflow"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete approval workflow?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        destructive
        loading={deleteWf.isPending}
        onConfirm={() => toDelete && deleteWf.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        Workflows drive who must approve each module action, in order. The first matching active
        workflow for a module is applied when an item is submitted for approval.
      </div>
    </div>
  );
}
