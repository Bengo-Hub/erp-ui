"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useContracts, useDeleteContract, useSaveContract } from "@/hooks/use-contracts";
import { useDebounce } from "@/hooks/use-debounce";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { normalizeList } from "@/lib/api/drf";
import { type Contract } from "@/lib/api/contracts";
import { PAGE_SIZE, relationLabel } from "@/lib/hrm";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "pending", label: "Pending" },
];

const PAY_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "fixed", label: "Fixed" },
];

function statusVariant(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "active") return "success" as const;
  if (v === "expired" || v === "terminated") return "error" as const;
  if (v === "pending") return "warning" as const;
  return "secondary" as const;
}

type Form = {
  employee: string;
  contract_start_date: string;
  contract_end_date: string;
  salary: string;
  pay_type: string;
  status: string;
  notes: string;
};

function toForm(c?: Contract): Form {
  const empId =
    c?.employee && typeof c.employee === "object" ? c.employee.id : (c?.employee ?? "");
  return {
    employee: empId ? String(empId) : "",
    contract_start_date: c?.contract_start_date ?? "",
    contract_end_date: c?.contract_end_date ?? "",
    salary: c?.salary != null ? String(c.salary) : "",
    pay_type: c?.pay_type ?? "monthly",
    status: c?.status ?? "active",
    notes: c?.notes ?? "",
  };
}

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined, status: status || undefined }),
    [page, debounced, status],
  );
  const { data, isLoading, error, refetch } = useContracts(params);
  const { results: rows, count } = normalizeList<Contract>(data);
  const save = useSaveContract();
  const del = useDeleteContract();
  const { options: employeeOptions } = useEmployeeOptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<Form>(toForm());
  const [toDelete, setToDelete] = useState<Contract | null>(null);

  const open = (c?: Contract) => {
    setEditing(c ?? null);
    setForm(toForm(c));
    setDialogOpen(true);
  };
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.employee || !form.contract_start_date) return;
    const payload: Partial<Contract> = {
      employee: Number(form.employee),
      contract_start_date: form.contract_start_date,
      contract_end_date: form.contract_end_date || undefined,
      salary: form.salary || undefined,
      pay_type: form.pay_type,
      status: form.status,
      notes: form.notes || undefined,
    };
    save.mutate({ id: editing?.id, data: payload }, { onSuccess: () => setDialogOpen(false) });
  };

  const columns: Column<Contract>[] = [
    {
      header: "Employee",
      cell: (c) =>
        c.employee_name ||
        (c.employee && typeof c.employee === "object" ? c.employee.name : relationLabel(c.employee)) ||
        "—",
    },
    { header: "Start", cell: (c) => c.contract_start_date || "—" },
    { header: "End", cell: (c) => c.contract_end_date || "—" },
    {
      header: "Salary",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (c) => (c.salary != null ? Number(c.salary).toLocaleString() : "—"),
    },
    { header: "Pay Type", cell: (c) => <span className="capitalize">{c.pay_type || "—"}</span> },
    { header: "Status", cell: (c) => <Badge variant={statusVariant(c.status)}>{c.status || "—"}</Badge> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => open(c)}>
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(c)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Contracts"
        subtitle="Employment contracts & terms"
        actions={
          <PermissionGate permission="add_employee">
            <Button size="sm" onClick={() => open()}>
              <Plus className="mr-1.5 size-4" /> Add Contract
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search employee, status…"
            className="min-w-[220px] flex-1"
          />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto min-w-[150px]">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No contracts found"
          emptyDescription="Add a contract or adjust your filters."
        />
        {rows.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit contract" : "Add contract"}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="c-emp" required className="sm:col-span-2">
            <Select id="c-emp" value={form.employee} onChange={(e) => set("employee", e.target.value)}>
              <option value="">Select employee…</option>
              {employeeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start date" htmlFor="c-start" required>
            <Input id="c-start" type="date" value={form.contract_start_date} onChange={(e) => set("contract_start_date", e.target.value)} />
          </Field>
          <Field label="End date" htmlFor="c-end">
            <Input id="c-end" type="date" value={form.contract_end_date} onChange={(e) => set("contract_end_date", e.target.value)} />
          </Field>
          <Field label="Salary" htmlFor="c-salary">
            <Input id="c-salary" type="number" step="0.01" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
          </Field>
          <Field label="Pay type" htmlFor="c-pay">
            <Select id="c-pay" value={form.pay_type} onChange={(e) => set("pay_type", e.target.value)}>
              {PAY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="c-status">
            <Select id="c-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" htmlFor="c-notes" className="sm:col-span-2">
            <Textarea id="c-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete contract?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
