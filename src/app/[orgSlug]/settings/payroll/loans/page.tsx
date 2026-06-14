"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteLoan, useLoans, useSaveLoan } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Loan } from "@/lib/api/payroll-settings";
import { formatMoney } from "@/lib/utils";

import { usePayrollSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Loan Name", required: true },
  { name: "interest_rate", label: "Interest Rate (%)", type: "number", step: "0.01" },
  { name: "max_amount", label: "Maximum Amount", type: "number", step: "0.01" },
  { name: "repayment_period", label: "Repayment Period (months)", type: "number" },
  { name: "is_active", label: "Active", type: "switch" },
];

export default function LoansPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("loans");
  const { data, isLoading, error, refetch } = useLoans();
  const save = useSaveLoan();
  const del = useDeleteLoan();
  const rows = normalizeList<Loan>(data).results;

  const columns: Column<Loan>[] = [
    { header: "Name", cell: (l) => <span className="font-medium">{l.name}</span> },
    { header: "Interest", cell: (l) => (l.interest_rate != null ? `${l.interest_rate}%` : "—") },
    {
      header: "Max Amount",
      className: "text-right",
      headerClassName: "text-right",
      cell: (l) => formatMoney(l.max_amount),
    },
    { header: "Period", cell: (l) => (l.repayment_period ? `${l.repayment_period} mo` : "—") },
    {
      header: "Status",
      cell: (l) => (
        <Badge variant={l.is_active === false ? "secondary" : "success"}>
          {l.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Loan"
        perms={{
          add: "add_payrollcomponents",
          change: "change_payrollcomponents",
          delete: "delete_payrollcomponents",
        }}
        toForm={(l) => ({
          name: l?.name ?? "",
          interest_rate: l?.interest_rate ?? "",
          max_amount: l?.max_amount ?? "",
          repayment_period: l?.repayment_period ?? "",
          is_active: l?.is_active ?? true,
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<Loan> }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
