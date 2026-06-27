"use client";

import { BadgeCheck, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useProjectOptions } from "@/hooks/use-option-hooks";
import {
  useApproveCasualLabor,
  useCasualLabor,
  useDeleteCasualLabor,
  useSaveCasualLabor,
} from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { CASUAL_PAYMENT_OPTIONS, CASUAL_WAGE_TYPES, type CasualLabor } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

type Form = {
  settlement_mode: string;
  employee_id: string;
  worker_name: string;
  engaged_by_employee_id: string;
  wage_type: string;
  quantity: string;
  rate: string;
  payment_option: string;
  payroll_month: string;
  payment_date: string;
  project_id: string;
  task_description: string;
};

const emptyForm: Form = {
  settlement_mode: "direct_payout",
  employee_id: "",
  worker_name: "",
  engaged_by_employee_id: "",
  wage_type: "daily_wages",
  quantity: "1",
  rate: "",
  payment_option: "",
  payroll_month: "",
  project_id: "",
  payment_date: "",
  task_description: "",
};

const wageTypeLabel = (v?: string) =>
  CASUAL_WAGE_TYPES.find((t) => t.value === v)?.label ?? (v === "lump_sum" ? "Lump Sum" : v ?? "—");

export default function CasualEmployeesPage() {
  const [month, setMonth] = useState("");
  const [wageType, setWageType] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const employees = useEmployeeOptions();
  const projects = useProjectOptions();

  const params = useMemo(
    () => ({
      payroll_month: month || undefined,
      wage_type: wageType || undefined,
      project_id: projectFilter || undefined,
    }),
    [month, wageType, projectFilter],
  );
  const { data, isLoading, error, refetch } = useCasualLabor(params);
  const save = useSaveCasualLabor();
  const approve = useApproveCasualLabor();
  const del = useDeleteCasualLabor();

  const rows = normalizeList<CasualLabor>(data).results;
  const totalIssued = (data as { total_issued?: string })?.total_issued;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.employee_name ?? ""} ${r.worker_name ?? ""} ${r.employee_number ?? ""}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const isReimburse = form.settlement_mode === "reimburse_engager";
  const amountPreview = (parseFloat(form.quantity) || 0) * (parseFloat(form.rate) || 0);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const submit = () => {
    save.mutate(
      { data: { ...form } as Partial<CasualLabor> },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const columns: Column<CasualLabor>[] = [
    { header: "Staff No.", cell: (c) => c.employee_number || "—" },
    {
      header: "Name",
      cell: (c) => <span className="font-medium">{c.employee_name || c.worker_name || "—"}</span>,
    },
    { header: "Type", cell: (c) => wageTypeLabel(c.wage_type) },
    { header: "Project", cell: (c) => (c.project_id ? String(c.project_id).slice(0, 8) : "—") },
    { header: "Qty", className: "text-right", headerClassName: "text-right", cell: (c) => c.quantity ?? "—" },
    { header: "Rate", className: "text-right", headerClassName: "text-right", cell: (c) => formatMoney(c.rate) },
    {
      header: "Amount Paid",
      className: "text-right",
      headerClassName: "text-right",
      cell: (c) => <span className="font-semibold">{formatMoney(c.amount)}</span>,
    },
    { header: "Payment Date", cell: (c) => c.payment_date || "—" },
    { header: "Payroll Month", cell: (c) => c.payroll_month || "—" },
    {
      header: "Status",
      cell: (c) => {
        const v = (c.status || "pending").toLowerCase();
        return (
          <Badge variant={v === "approved" || v === "paid" ? "success" : v === "rejected" ? "error" : "warning"}>
            {c.status || "Pending"}
          </Badge>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          {c.status !== "approved" && c.status !== "paid" && (
            <PermissionGate permission={["hrm.payroll.manage"]}>
              <Button size="sm" variant="ghost" disabled={approve.isPending} onClick={() => approve.mutate(c.id)} title="Approve — posts the cost to finance">
                <BadgeCheck className="size-4 text-green-600" />
              </Button>
            </PermissionGate>
          )}
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)} title="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Casual Employees"
        subtitle="Daily/hourly wages, overtime and payments-in-lieu — paid by the unit, outside the PAYE run."
        actions={
          <div className="flex items-center gap-3">
            {totalIssued != null && (
              <span className="rounded-md bg-muted px-3 py-1.5 text-sm">
                Total Issued: <span className="font-semibold">{formatMoney(totalIssued)}</span>
              </span>
            )}
            <PermissionGate permission={["hrm.payroll.manage"]}>
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-1.5 size-4" /> Add Casual Payment
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          <Select value={wageType} onChange={(e) => setWageType(e.target.value)} className="w-auto min-w-[150px]">
            <option value="">All Additions</option>
            {CASUAL_WAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <div className="min-w-[180px]">
            <Combobox value={projectFilter} onChange={setProjectFilter} options={projects.options} placeholder="All Projects" />
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search…" className="min-w-[200px] flex-1" />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No casual payments"
          emptyDescription="Add a daily/hourly wage, overtime or payment-in-lieu."
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Casual Payment"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={save.isPending || amountPreview <= 0}>
              {save.isPending ? "Saving…" : `Save (${formatMoney(amountPreview)})`}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment To" htmlFor="settlement_mode">
            <Select id="settlement_mode" value={form.settlement_mode} onChange={(e) => set("settlement_mode", e.target.value)}>
              <option value="direct_payout">Casual Employee (direct)</option>
              <option value="reimburse_engager">Informal Worker (reimburse engager)</option>
            </Select>
          </Field>
          {isReimburse ? (
            <>
              <Field label="Worker Name" htmlFor="worker_name" required>
                <Input id="worker_name" value={form.worker_name} onChange={(e) => set("worker_name", e.target.value)} />
              </Field>
              <Field label="Engaged By" className="sm:col-span-2">
                <Combobox value={form.engaged_by_employee_id} onChange={(v) => set("engaged_by_employee_id", v)} options={employees.options} loading={employees.isLoading} placeholder="Select employee" />
              </Field>
            </>
          ) : (
            <Field label="Casual Employee" required>
              <Combobox value={form.employee_id} onChange={(v) => set("employee_id", v)} options={employees.options} loading={employees.isLoading} placeholder="Select casual employee" />
            </Field>
          )}
          <Field label="Addition Type" htmlFor="wage_type">
            <Select id="wage_type" value={form.wage_type} onChange={(e) => set("wage_type", e.target.value)}>
              {CASUAL_WAGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity (days/hours)" htmlFor="quantity">
            <Input id="quantity" type="number" step="0.01" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </Field>
          <Field label="Rate" htmlFor="rate" required>
            <Input id="rate" type="number" step="0.01" value={form.rate} onChange={(e) => set("rate", e.target.value)} />
          </Field>
          <Field label="Salary Payment Option" htmlFor="payment_option">
            <Select id="payment_option" value={form.payment_option} onChange={(e) => set("payment_option", e.target.value)}>
              <option value="">Select…</option>
              {CASUAL_PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Payroll Month" htmlFor="payroll_month">
            <Input id="payroll_month" type="month" value={form.payroll_month} onChange={(e) => set("payroll_month", e.target.value)} />
          </Field>
          <Field label="Payment Date" htmlFor="payment_date">
            <Input id="payment_date" type="date" value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)} />
          </Field>
          <Field label="Project (optional)" className="sm:col-span-2">
            <Combobox value={form.project_id} onChange={(v) => set("project_id", v)} options={projects.options} placeholder="Select project" />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        title="Delete casual payment?"
        description="This removes the casual payment record."
        confirmLabel="Delete"
        loading={del.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId == null) return;
          del.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />
    </div>
  );
}
