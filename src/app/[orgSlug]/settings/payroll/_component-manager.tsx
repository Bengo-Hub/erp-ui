"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { normalizeList } from "@/lib/api/drf";
import { type PayrollComponent } from "@/lib/api/payroll-settings";
import { formatMoney } from "@/lib/utils";

import { usePayrollSettingsTabs } from "./_tabs";

interface ComponentHooks {
  list: () => {
    data: unknown;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
  save: () => {
    mutate: (a: { id?: number | string; data: Partial<PayrollComponent> }, o?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
  remove: () => { mutate: (id: number | string, o?: { onSuccess?: () => void }) => void; isPending: boolean };
}

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "amount", label: "Default Amount", type: "number", step: "0.01" },
  { name: "rate", label: "Rate (%)", type: "number", step: "0.01" },
  { name: "is_percentage", label: "Percentage-based", type: "switch" },
  { name: "is_taxable", label: "Taxable", type: "switch" },
  { name: "is_active", label: "Active", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

/** Shared editor for Earnings / Deductions / Benefits payroll components. */
export function PayComponentManager({
  tabKey,
  entityLabel,
  hooks,
}: {
  tabKey: string;
  entityLabel: string;
  hooks: ComponentHooks;
}) {
  const { tabs, active, onChange } = usePayrollSettingsTabs(tabKey);
  const { data, isLoading, error, refetch } = hooks.list();
  const save = hooks.save();
  const del = hooks.remove();
  const rows = normalizeList<PayrollComponent>(
    data as PayrollComponent[] | undefined,
  ).results;

  const columns: Column<PayrollComponent>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
    {
      header: "Amount / Rate",
      className: "text-right",
      headerClassName: "text-right",
      cell: (c) => (c.is_percentage ? `${c.rate ?? 0}%` : formatMoney(c.amount)),
    },
    {
      header: "Taxable",
      cell: (c) => (c.is_taxable ? <Badge variant="warning">Taxable</Badge> : <Badge variant="secondary">Exempt</Badge>),
    },
    {
      header: "Status",
      cell: (c) => (
        <Badge variant={c.is_active === false ? "secondary" : "success"}>
          {c.is_active === false ? "Inactive" : "Active"}
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
        entityLabel={entityLabel}
        perms={{
          add: "add_payrollcomponents",
          change: "change_payrollcomponents",
          delete: "delete_payrollcomponents",
        }}
        toForm={(c) => ({
          name: c?.name ?? "",
          amount: c?.amount ?? "",
          rate: c?.rate ?? "",
          is_percentage: c?.is_percentage ?? false,
          is_taxable: c?.is_taxable ?? false,
          is_active: c?.is_active ?? true,
          description: c?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<PayrollComponent> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
