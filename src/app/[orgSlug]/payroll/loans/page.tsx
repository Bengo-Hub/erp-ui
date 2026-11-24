"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useLoanRecoveries, useLoans, useLoanTypes, useSaveLoan } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Loan, type LoanType } from "@/lib/api/payroll-settings";
import { formatDate, formatMoney } from "@/lib/utils";

const emptyForm = { employee_id: "", loan_type_id: "", principal_amount: "", no_of_installments: "12", start: "", interest_rate: "" };

/**
 * Employee loans: issue a loan under a loan type, then follow its balance and the recoveries
 * payroll takes each month. Recoveries are written back to the balance when the run is posted.
 */
export default function EmployeeLoansPage() {
  const { data, isLoading, error, refetch } = useLoans();
  const { data: typeData } = useLoanTypes();
  const employees = useEmployeeOptions();
  const save = useSaveLoan();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [viewing, setViewing] = useState<Loan | null>(null);
  const recoveries = useLoanRecoveries(viewing?.id ?? null);

  const rows = normalizeList<Loan>(data).results;
  const types = normalizeList<LoanType>(typeData).results;
  const typeName = useMemo(() => new Map(types.map((t) => [t.id, t.title])), [types]);
  const empName = useMemo(() => new Map(employees.options.map((o) => [o.value, o.label])), [employees.options]);
  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const principal = Number(form.principal_amount) || 0;
  const installments = Math.max(1, Number(form.no_of_installments) || 1);

  const submit = () =>
    save.mutate(
      {
        data: {
          employee_id: form.employee_id,
          loan_type_id: form.loan_type_id || undefined,
          principal_amount: form.principal_amount,
          no_of_installments: installments,
          start_date: form.start ? `${form.start}-01` : undefined,
          interest_rate: form.interest_rate || undefined,
          is_active: true,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ ...emptyForm });
        },
      },
    );

  const columns: Column<Loan>[] = [
    {
      header: "Employee",
      cell: (l) => <span className="font-medium">{empName.get(String(l.employee ?? l.employee_id)) ?? "—"}</span>,
    },
    { header: "Type", cell: (l) => (l.loan_type_id ? (typeName.get(l.loan_type_id) ?? "—") : "—") },
    { header: "Principal", className: "text-right", headerClassName: "text-right", cell: (l) => formatMoney(l.principal_amount) },
    { header: "Installment", className: "text-right", headerClassName: "text-right", cell: (l) => formatMoney(l.monthly_installment) },
    {
      header: "Paid",
      cell: (l) => (l.installments ? `${l.installments_paid ?? 0} of ${l.installments}` : "—"),
    },
    { header: "Repaid", className: "text-right", headerClassName: "text-right", cell: (l) => formatMoney(l.amount_repaid) },
    { header: "Balance", className: "text-right font-semibold", headerClassName: "text-right", cell: (l) => formatMoney(l.balance) },
    { header: "Start", cell: (l) => formatDate(l.start_date) },
    {
      header: "Status",
      cell: (l) => (
        <Badge variant={l.is_active ? (Number(l.balance) > 0 ? "warning" : "success") : "secondary"}>
          {!l.is_active ? "Inactive" : Number(l.balance) > 0 ? "Recovering" : "Cleared"}
        </Badge>
      ),
    },
  ];

  const recoveryRows = recoveries.data?.results ?? [];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Employee Loans"
        subtitle="Loans issued to employees and recovered from payroll each month"
        actions={
          <PermissionGate permission={["hrm.payroll.manage"]}>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Issue Loan
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(l) => l.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onRowClick={(l) => setViewing(l)}
          emptyTitle="No employee loans"
          emptyDescription="Issue a loan to see its balance and recoveries here."
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Issue Loan"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending || !form.employee_id || principal <= 0}>
              {save.isPending ? "Saving…" : "Issue Loan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" required className="sm:col-span-2">
            <Combobox
              value={form.employee_id}
              onChange={(v) => set("employee_id", v)}
              options={employees.options}
              loading={employees.isLoading}
              placeholder="Select employee"
            />
          </Field>
          <Field label="Loan Type" help={types.length ? undefined : "Add loan types under Settings, Payroll, Loans."}>
            <Combobox
              value={form.loan_type_id}
              onChange={(v) => set("loan_type_id", v)}
              options={types.filter((t) => t.is_active !== false).map((t) => ({ value: t.id, label: t.title }))}
              placeholder="Select loan type"
            />
          </Field>
          <Field label="Principal" required>
            <Input type="number" step="0.01" min="0" value={form.principal_amount} onChange={(e) => set("principal_amount", e.target.value)} />
          </Field>
          <Field label="Installments (months)" required>
            <Input type="number" min="1" value={form.no_of_installments} onChange={(e) => set("no_of_installments", e.target.value)} />
          </Field>
          <Field label="First recovery month">
            <Input type="month" value={form.start} onChange={(e) => set("start", e.target.value)} />
          </Field>
          <Field label="Interest rate (%)">
            <Input type="number" step="0.01" min="0" value={form.interest_rate} onChange={(e) => set("interest_rate", e.target.value)} />
          </Field>
          <p className="self-end text-sm text-muted-foreground">
            Monthly installment {formatMoney(principal / installments)}
          </p>
        </div>
      </Dialog>

      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Loan recoveries, ${empName.get(String(viewing?.employee ?? viewing?.employee_id)) ?? ""}`}
        description={
          viewing
            ? `Principal ${formatMoney(viewing.principal_amount)}, repaid ${formatMoney(viewing.amount_repaid)}, balance ${formatMoney(viewing.balance)}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        <DataTable
          columns={[
            { header: "Period", cell: (r) => r.payment_period || "—" },
            { header: "Amount", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.amount) },
            {
              header: "Status",
              cell: (r) => (
                <Badge variant={r.applied ? "success" : "secondary"}>{r.applied ? "Recovered" : "On payslip, not posted"}</Badge>
              ),
            },
          ]}
          rows={recoveryRows}
          rowKey={(r) => r.id}
          isLoading={recoveries.isLoading}
          error={recoveries.error}
          emptyTitle="No recoveries yet"
          emptyDescription="Payroll recovers the installment from the first run on or after the start month."
        />
      </Dialog>
    </div>
  );
}
