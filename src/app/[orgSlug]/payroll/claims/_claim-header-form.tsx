"use client";

import { type ReactNode } from "react";

import { Combobox } from "@/components/ui/combobox";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useCostCenterOptions, useProjectOptions } from "@/hooks/use-option-hooks";

export const CLAIM_TYPES = [
  { value: "reimbursement", label: "Reimbursement (itemised, non-taxable)" },
  { value: "per_diem", label: "Per Diem (days × rate)" },
  { value: "mileage", label: "Mileage (distance × rate)" },
  { value: "other", label: "Other (itemised)" },
] as const;

/** Header values shared between create + edit. amount is auto-computed from the detail
 * tables for itemised/mileage/per-diem types, so it is not directly editable there. */
export interface ClaimHeaderValues {
  employee: string;
  claim_type: string;
  category: string;
  date: string;
  project_id: string;
  cost_center_id: string;
  taxable: boolean;
  description: string;
  amount: string;
}

export function emptyHeader(): ClaimHeaderValues {
  return {
    employee: "",
    claim_type: "reimbursement",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    project_id: "",
    cost_center_id: "",
    taxable: false,
    description: "",
    amount: "",
  };
}

export function ClaimHeaderForm({
  values,
  setField,
  /** Hide the employee + claim-type pickers once the header is locked in (edit mode). */
  lockType = false,
  amountSlot,
}: {
  values: ClaimHeaderValues;
  setField: <K extends keyof ClaimHeaderValues>(name: K, value: ClaimHeaderValues[K]) => void;
  lockType?: boolean;
  /** Custom amount control (e.g. the per-diem days×rate widget). When omitted a read-only
   *  total (driven by the line tables) is shown for non-per-diem types. */
  amountSlot?: ReactNode;
}) {
  const employees = useEmployeeOptions();
  const projects = useProjectOptions();
  const costCenters = useCostCenterOptions();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Employee" htmlFor="employee" required>
        <Combobox
          id="employee"
          value={values.employee}
          onChange={(v) => setField("employee", v)}
          options={employees.options}
          loading={employees.isLoading}
          disabled={lockType}
          placeholder="Select employee"
        />
      </Field>

      <Field label="Claim Type" htmlFor="claim_type" required>
        <Select
          id="claim_type"
          value={values.claim_type}
          disabled={lockType}
          onChange={(e) => setField("claim_type", e.target.value)}
        >
          {CLAIM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Effective Date" htmlFor="date">
        <Input
          id="date"
          type="date"
          value={values.date}
          onChange={(e) => setField("date", e.target.value)}
        />
      </Field>

      <Field
        label="Total Amount"
        htmlFor="amount"
        help="Auto-calculated from the lines below"
      >
        {amountSlot ?? (
          <Input id="amount" value={values.amount ? String(values.amount) : "0.00"} readOnly disabled />
        )}
      </Field>

      <Field label="Project (optional)" htmlFor="project_id">
        <Combobox
          id="project_id"
          value={values.project_id}
          onChange={(v) => setField("project_id", v)}
          options={projects.options}
          loading={projects.isLoading}
          placeholder="Select project"
        />
      </Field>

      <Field label="Cost Center (optional)" htmlFor="cost_center_id">
        <Combobox
          id="cost_center_id"
          value={values.cost_center_id}
          onChange={(v) => setField("cost_center_id", v)}
          options={costCenters.options}
          loading={costCenters.isLoading}
          placeholder="Select cost center"
        />
      </Field>

      <Field
        label="Taxable"
        htmlFor="taxable"
        className="sm:col-span-2"
        help="Taxable allowances (per-diem / mileage over KRA caps) flow to the payslip & PAYE; non-taxable reimbursements are paid via finance and never inflate PAYE."
      >
        <div className="flex items-center gap-2">
          <Switch id="taxable" checked={values.taxable} onChange={(c) => setField("taxable", c)} />
          <span className="text-sm text-muted-foreground">
            {values.taxable ? "Taxable (to payslip)" : "Non-taxable (paid via finance)"}
          </span>
        </div>
      </Field>

      <Field label="Description" htmlFor="description" className="sm:col-span-2">
        <RichTextEditor
          id="description"
          value={values.description}
          onChange={(html) => setField("description", html)}
          placeholder="Purpose / notes for this claim"
        />
      </Field>
    </div>
  );
}
