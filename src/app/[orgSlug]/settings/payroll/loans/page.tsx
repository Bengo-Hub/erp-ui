"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteLoanType, useLoanTypes, useSaveLoanType } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type LoanType } from "@/lib/api/payroll-settings";

import { usePayrollSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "title", label: "Loan Type", required: true },
  { name: "account_code", label: "GL Account Code" },
  { name: "is_active", label: "Active", type: "switch" },
];

/** Loan types. Loans to employees are issued under Payroll, Employee Loans. */
export default function LoanTypesPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("loans");
  const { data, isLoading, error, refetch } = useLoanTypes();
  const save = useSaveLoanType();
  const del = useDeleteLoanType();
  const rows = normalizeList<LoanType>(data).results;

  const columns: Column<LoanType>[] = [
    { header: "Loan Type", cell: (l) => <span className="font-medium">{l.title}</span> },
    { header: "GL Account", cell: (l) => l.account_code || "—" },
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
      <PageHeader title="Payroll Settings" subtitle="Components, loan types, formulas & statutory rates" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Loan Type"
        perms={{
          add: "add_payrollcomponents",
          change: "change_payrollcomponents",
          delete: "delete_payrollcomponents",
        }}
        toForm={(l) => ({
          title: l?.title ?? "",
          account_code: l?.account_code ?? "",
          is_active: l?.is_active ?? true,
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<LoanType> }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
