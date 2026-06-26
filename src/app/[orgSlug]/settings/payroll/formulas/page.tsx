"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge, Button, Card } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import {
  useDeleteFormula,
  useFormulas,
  useReliefStatus,
  useSaveFormula,
  useUpdateRelief,
} from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Formula } from "@/lib/api/payroll-settings";
import { formatDate } from "@/lib/utils";

import { usePayrollSettingsTabs } from "../_tabs";

const RELIEF_TYPES = [
  { value: "personal_relief", label: "Personal Relief" },
  { value: "insurance_relief", label: "Insurance Relief" },
  { value: "housing_relief", label: "Affordable Housing Relief" },
  { value: "disability_relief", label: "Disability Exemption" },
  { value: "pension_relief", label: "Pension Relief" },
];

/** Toggle KRA tax reliefs on/off (formulas/relief-status + formula-management). */
function TaxReliefCard() {
  const [reliefType, setReliefType] = useState(RELIEF_TYPES[0].value);
  const { data: status, isLoading } = useReliefStatus(reliefType);
  const update = useUpdateRelief();
  const [effectiveDate, setEffectiveDate] = useState("");

  const isActive = !!status?.is_active;

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Tax Reliefs</h3>
        <p className="text-xs text-muted-foreground">
          Enable or disable statutory reliefs applied during payroll processing.
        </p>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-4">
        <Field label="Relief Type" className="sm:col-span-2">
          <Select value={reliefType} onChange={(e) => setReliefType(e.target.value)}>
            {RELIEF_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading…</span>
          ) : (
            <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
          )}
        </Field>
        <Field label="Amount">
          <span className="text-sm">{status?.amount != null && status.amount !== "" ? String(status.amount) : "—"}</span>
        </Field>
        <Field label="Effective Date" className="sm:col-span-2">
          <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </Field>
        <PermissionGate permission="change_defaultpayrollsettings">
          <div className="sm:col-span-2 flex gap-2">
            <Button
              size="sm"
              variant={isActive ? "outline" : "primary"}
              disabled={update.isPending}
              onClick={() => update.mutate({ relief_type: reliefType, is_active: !isActive, effective_date: effectiveDate || undefined })}
            >
              {update.isPending ? "Saving…" : isActive ? "Disable" : "Enable"}
            </Button>
          </div>
        </PermissionGate>
      </div>
    </Card>
  );
}

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
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useFormulas();
  const save = useSaveFormula();
  const del = useDeleteFormula();
  const rows = normalizeList<Formula>(data).results;

  const editHref = (id: string | number) => `/${params.orgSlug}/settings/payroll/formulas/${id}`;

  const columns: Column<Formula>[] = [
    { header: "Name", cell: (f) => <span className="font-medium">{f.name}</span> },
    { header: "Type", cell: (f) => f.type || "—" },
    { header: "Effective", cell: (f) => formatDate(f.effective_date) },
    {
      header: "Status",
      cell: (f) =>
        f.is_current ? <Badge variant="success">Current</Badge> : <Badge variant="secondary">Historical</Badge>,
    },
    {
      header: "Rates",
      cell: (f) => (
        <Button size="sm" variant="outline" onClick={() => router.push(editHref(f.id))}>
          <SlidersHorizontal className="mr-1 size-3.5" /> Edit bands
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />
      <div className="flex justify-end">
        <PermissionGate permission={["hrm.payroll.manage", "add_payrollcomponents"]}>
          <Button size="sm" onClick={() => router.push(editHref("new"))}>
            <SlidersHorizontal className="mr-1.5 size-4" /> New formula (bands editor)
          </Button>
        </PermissionGate>
      </div>
      <TaxReliefCard />
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
