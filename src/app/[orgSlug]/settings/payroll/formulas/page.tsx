"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteFormula, useFormulas, useSaveFormula } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Formula } from "@/lib/api/payroll-settings";
import { formatDate } from "@/lib/utils";

import { usePayrollSettingsTabs } from "../_tabs";

const FORMULA_TYPES = [
  { value: "PAYE", label: "PAYE (Income Tax)" },
  { value: "NSSF", label: "NSSF" },
  { value: "SHIF", label: "SHIF / NHIF" },
  { value: "HOUSING_LEVY", label: "Housing Levy" },
  { value: "NITA", label: "NITA" },
  { value: "CUSTOM", label: "Custom" },
];

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "type", label: "Type", type: "select", options: FORMULA_TYPES },
  { name: "category", label: "Category" },
  { name: "effective_date", label: "Effective Date", type: "date" },
  { name: "is_current", label: "Current", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function FormulasPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("formulas");
  const { data, isLoading, error, refetch } = useFormulas();
  const save = useSaveFormula();
  const del = useDeleteFormula();
  const rows = normalizeList<Formula>(data).results;

  const columns: Column<Formula>[] = [
    { header: "Name", cell: (f) => <span className="font-medium">{f.name}</span> },
    { header: "Type", cell: (f) => f.type || "—" },
    { header: "Effective", cell: (f) => formatDate(f.effective_date) },
    {
      header: "Status",
      cell: (f) =>
        f.is_current ? <Badge variant="success">Current</Badge> : <Badge variant="secondary">Historical</Badge>,
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
        entityLabel="Formula"
        perms={{
          add: "add_payrollcomponents",
          change: "change_payrollcomponents",
          delete: "delete_payrollcomponents",
        }}
        toForm={(f) => ({
          name: f?.name ?? "",
          type: f?.type ?? "",
          category: f?.category ?? "",
          effective_date: f?.effective_date ?? "",
          is_current: f?.is_current ?? false,
          description: f?.description ?? "",
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<Formula> }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
