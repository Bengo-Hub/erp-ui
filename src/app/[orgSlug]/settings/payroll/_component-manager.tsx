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

// Per-category fields. Deductions expose the employer-contribution + checkoff/registration
// columns (NSSF/pension), benefits/earnings expose taxable + per-unit. Built from the
// category so each tab only shows the controls that apply to it (mirrors the legacy
// "Default Payroll Settings" Deductions vs Benefits vs Earnings tabs).
function fieldsFor(category: string): CrudFieldDef[] {
  const isDeduction = category === "Deductions";
  const isEarning = category === "Earnings";
  const isBenefit = category === "Benefits";
  return [
    { name: "name", label: "Title", required: true },
    { name: "amount", label: isDeduction ? "Employee Fixed Amount" : "Fixed Amount", type: "number", step: "0.01" },
    { name: "percentage", label: "or % of Basic Pay", type: "number", step: "0.01" },
    ...(isDeduction
      ? ([
          { name: "employer_amount", label: "Employer Fixed Amount", type: "number", step: "0.01" },
          { name: "employer_percentage", label: "or Employer % of Basic", type: "number", step: "0.01" },
          { name: "mode", label: "Calculation Mode", type: "select", options: [
              { value: "", label: "—" }, { value: "fixed", label: "Fixed amount" },
              { value: "percent_of_basic", label: "% of Basic" }, { value: "percent_of_gross", label: "% of Gross" },
            ] },
          { name: "registration_no", label: "Registration No" },
          { name: "checkoff", label: "Checkoff (deduct on employee's behalf)", type: "switch" },
        ] as CrudFieldDef[])
      : []),
    ...(isEarning
      ? ([
          { name: "unit_type", label: "Unit", type: "select", options: [
              { value: "", label: "—" }, { value: "days", label: "Days" },
              { value: "hours", label: "Hours" }, { value: "pieces", label: "Pieces" },
            ] },
          { name: "unit_rate", label: "Rate per Unit", type: "number", step: "0.01" },
          { name: "quantity", label: "Quantity", type: "number", step: "0.01" },
        ] as CrudFieldDef[])
      : []),
    ...(isBenefit
      ? ([{ name: "non_cash", label: "Non-cash (in-kind; taxed, not paid in cash)", type: "switch" }] as CrudFieldDef[])
      : []),
    { name: "is_taxable", label: "Taxable", type: "switch" },
    { name: "is_active", label: "Active", type: "switch" },
    { name: "effective_from", label: "Effective From", type: "date" },
    { name: "effective_to", label: "Effective To", type: "date" },
    { name: "description", label: "Description", type: "textarea", span2: true },
  ];
}

const num = (v: unknown): number => (v == null || v === "" ? 0 : Number(v) || 0);

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

  // Category drives which fields/columns render (Deductions show the employer + checkoff
  // columns; Earnings show per-unit). Derived from the tab key.
  const category =
    tabKey === "deductions" ? "Deductions" : tabKey === "earnings" ? "Earnings" : "Benefits";
  const isDeduction = category === "Deductions";

  // A component's employee-side value: fixed amount, or a "% of basic" when a percentage is set.
  const valueOf = (c: PayrollComponent) =>
    num(c.percentage) > 0 ? `${num(c.percentage)}% of basic` : formatMoney(c.amount);
  const employerOf = (c: PayrollComponent) =>
    num(c.employer_percentage) > 0
      ? `${num(c.employer_percentage)}%`
      : num(c.employer_amount) > 0
        ? formatMoney(c.employer_amount)
        : "—";

  const columns: Column<PayrollComponent>[] = [
    { header: "Title", cell: (c) => <span className="font-medium">{c.name}</span> },
    {
      header: isDeduction ? "Employee Deduction" : "Amount / Rate",
      className: "text-right",
      headerClassName: "text-right",
      cell: (c) => valueOf(c),
    },
    ...(isDeduction
      ? ([
          {
            header: "Employer Contribution",
            className: "text-right",
            headerClassName: "text-right",
            cell: (c) => employerOf(c),
          },
        ] as Column<PayrollComponent>[])
      : []),
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
        fields={fieldsFor(category)}
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
          percentage: c?.percentage ?? "",
          employer_amount: c?.employer_amount ?? "",
          employer_percentage: c?.employer_percentage ?? "",
          registration_no: c?.registration_no ?? "",
          checkoff: c?.checkoff ?? true,
          mode: c?.mode ?? "",
          non_cash: c?.non_cash ?? false,
          unit_type: c?.unit_type ?? "",
          unit_rate: c?.unit_rate ?? "",
          quantity: c?.quantity ?? "",
          is_taxable: c?.is_taxable ?? false,
          is_active: c?.is_active ?? true,
          effective_from: c?.effective_from ?? "",
          effective_to: c?.effective_to ?? "",
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
