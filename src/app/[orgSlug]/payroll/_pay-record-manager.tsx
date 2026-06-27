"use client";

import { Ban, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs } from "@/components/ui/tabs";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { PageHeader } from "@/components/ui/page-header";
import { normalizeList } from "@/lib/api/drf";
import { type PayComponentRecord } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

interface MutationLike<V> {
  mutate: (vars: V, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
}

interface RecordHooks {
  list: () => { data: unknown; isLoading: boolean; error: unknown; refetch: () => void };
  save: () => MutationLike<{ id?: number | string; data: Partial<PayComponentRecord> }>;
  remove: () => MutationLike<number | string>;
  /** Approve (→ Scheduled) / disapprove (→ Disapproved). */
  setApproval: () => MutationLike<{ id: number | string; approve: boolean }>;
}

/** Derive a UI status from the (approved, is_active) flag pair the backend exposes. */
function statusOf(r: PayComponentRecord): "scheduled" | "pending" | "disapproved" {
  const explicit = (r.status || "").toLowerCase();
  if (explicit.includes("disapprov") || explicit === "nulled") return "disapproved";
  if (explicit === "scheduled" || explicit === "approved") return "scheduled";
  if (explicit === "pending") return "pending";
  if (r.approved && r.is_active !== false) return "scheduled";
  if (!r.approved && r.is_active === false) return "disapproved";
  return "pending";
}

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "disapproved", label: "Disapproved" },
] as const;

interface FormState {
  employee: string;
  amount: string;
  date: string;
  reason: string;
  description: string;
  no_of_installments: string;
}

const emptyForm = (): FormState => ({
  employee: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  reason: "",
  description: "",
  no_of_installments: "1",
});

/** Shared editor for salary advances and losses/damages (same record shape):
 *  installment config + schedule preview, status tabs, approve / disapprove actions. */
export function PayRecordManager({
  title,
  subtitle,
  entityLabel,
  hooks,
  perms,
}: {
  title: string;
  subtitle: string;
  entityLabel: string;
  hooks: RecordHooks;
  perms?: { add?: string; change?: string; delete?: string };
}) {
  const { data, isLoading, error, refetch } = hooks.list();
  const save = hooks.save();
  const del = hooks.remove();
  const setApproval = hooks.setApproval();
  const employees = useEmployeeOptions();

  const rows = normalizeList<PayComponentRecord>(data as PayComponentRecord[] | undefined).results;

  const [tab, setTab] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PayComponentRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [toDelete, setToDelete] = useState<PayComponentRecord | null>(null);
  const [toApprove, setToApprove] = useState<{ row: PayComponentRecord; approve: boolean } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, pending: 0, scheduled: 0, disapproved: 0 };
    rows.forEach((r) => (c[statusOf(r)] += 1));
    return c;
  }, [rows]);

  const filtered = tab === "all" ? rows : rows.filter((r) => statusOf(r) === tab);

  const installments = Math.max(1, Number(form.no_of_installments) || 1);
  const amount = Number(form.amount) || 0;
  const perInstallment = installments > 0 ? amount / installments : amount;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };
  const openEdit = (r: PayComponentRecord) => {
    setEditing(r);
    setForm({
      employee: String(r.employee_id ?? r.employee ?? ""),
      amount: String(r.amount ?? ""),
      date: r.date ?? "",
      reason: r.reason ?? "",
      description: r.description ?? "",
      no_of_installments: String(r.no_of_installments ?? 1),
    });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.employee || !form.amount) return;
    const data: Partial<PayComponentRecord> = {
      employee_id: form.employee,
      amount: form.amount,
      date: form.date || undefined,
      reason: form.reason || undefined,
      description: form.description || undefined,
      no_of_installments: installments,
      // Reuse an existing RepayOption on edit so the backend updates rather than duplicates it.
      repay_option_id: editing?.repay_option_id ?? undefined,
    };
    save.mutate({ id: editing?.id, data }, { onSuccess: () => setDialogOpen(false) });
  };

  const columns: Column<PayComponentRecord>[] = [
    {
      header: "Employee",
      cell: (r) => <span className="font-medium">{r.employee_name || r.employee_id || r.employee || "—"}</span>,
    },
    {
      header: "Amount",
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.amount),
    },
    {
      header: "Installments",
      cell: (r) => (r.no_of_installments && r.no_of_installments > 1 ? `${r.no_of_installments}×` : "Lump sum"),
    },
    { header: "Reason", cell: (r) => r.reason || (r.description ? "—" : "—") },
    { header: "Date", cell: (r) => formatDate(r.date) },
    {
      header: "Status",
      cell: (r) => {
        const s = statusOf(r);
        return (
          <Badge variant={s === "scheduled" ? "success" : s === "disapproved" ? "error" : "warning"}>
            {s === "scheduled" ? "Scheduled" : s === "disapproved" ? "Disapproved" : "Pending"}
          </Badge>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => {
        const s = statusOf(r);
        return (
          <div className="flex items-center justify-end gap-1">
            {s !== "scheduled" && (
              <IconButton label="Approve & schedule" onClick={() => setToApprove({ row: r, approve: true })}>
                <CheckCircle2 className="size-4 text-green-600" />
              </IconButton>
            )}
            {s !== "disapproved" && (
              <IconButton label="Disapprove" onClick={() => setToApprove({ row: r, approve: false })}>
                <Ban className="size-4 text-amber-600" />
              </IconButton>
            )}
            <PermissionGate permission={perms?.change}>
              <IconButton label={`Edit ${entityLabel}`} onClick={() => openEdit(r)}>
                <Pencil className="size-4" />
              </IconButton>
            </PermissionGate>
            <PermissionGate permission={perms?.delete}>
              <IconButton label={`Delete ${entityLabel}`} onClick={() => setToDelete(r)}>
                <Trash2 className="size-4 text-destructive" />
              </IconButton>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <PermissionGate permission={perms?.add}>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" /> Add {entityLabel}
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="px-4 pt-3">
          <Tabs
            tabs={TABS.map((t) => ({
              key: t.key,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                    {counts[t.key] ?? 0}
                  </span>
                </span>
              ),
            }))}
            active={tab}
            onChange={setTab}
          />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={`No ${entityLabel.toLowerCase()}s`}
          emptyDescription="Nothing in this view yet."
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${editing ? "Edit" : "Add"} ${entityLabel}`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending || !form.employee || !form.amount}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="employee" required className="sm:col-span-2">
            <Combobox
              id="employee"
              value={form.employee}
              onChange={(v) => setForm((f) => ({ ...f, employee: v }))}
              options={employees.options}
              loading={employees.isLoading}
              placeholder="Select employee"
            />
          </Field>

          <Field label="Value / Amount" htmlFor="amount" required>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>

          <Field label="Effective Date" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>

          <Field label="Reason" htmlFor="reason" className="sm:col-span-2">
            <Input
              id="reason"
              value={form.reason}
              placeholder="Short summary"
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </Field>

          <Field
            label="Recover in N installments"
            htmlFor="installments"
            help="2 or more spreads the recovery across payslips; 1 = single lump-sum deduction."
          >
            <Input
              id="installments"
              type="number"
              min="1"
              step="1"
              value={form.no_of_installments}
              onChange={(e) => setForm((f) => ({ ...f, no_of_installments: e.target.value }))}
            />
          </Field>

          <Field label="Per-installment amount" htmlFor="per-installment">
            <div className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold">
              {formatMoney(perInstallment)}
            </div>
          </Field>

          {installments > 1 && amount > 0 && (
            <div className="sm:col-span-2 rounded-lg border border-border bg-accent/5 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Recovery schedule preview</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.min(installments, 12) }).map((_, i) => (
                  <Badge key={i} variant="secondary">
                    #{i + 1}: {formatMoney(perInstallment)}
                  </Badge>
                ))}
                {installments > 12 && (
                  <span className="text-xs text-muted-foreground">+{installments - 12} more</span>
                )}
              </div>
            </div>
          )}

          <Field label="Description / Notes" htmlFor="description" className="sm:col-span-2">
            <RichTextEditor
              id="description"
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              placeholder="Details of this record"
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${entityLabel.toLowerCase()}?`}
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />

      <ConfirmDialog
        open={!!toApprove}
        title={toApprove?.approve ? `Approve & schedule ${entityLabel.toLowerCase()}?` : `Disapprove ${entityLabel.toLowerCase()}?`}
        description={
          toApprove?.approve
            ? "Approving schedules the recovery against the employee's upcoming payslips."
            : "Disapproving stops the recovery and marks the record as disapproved."
        }
        confirmLabel={toApprove?.approve ? "Approve" : "Disapprove"}
        destructive={!toApprove?.approve}
        loading={setApproval.isPending}
        onCancel={() => setToApprove(null)}
        onConfirm={() =>
          toApprove &&
          setApproval.mutate(
            { id: toApprove.row.id, approve: toApprove.approve },
            { onSuccess: () => setToApprove(null) },
          )
        }
      />
    </div>
  );
}
