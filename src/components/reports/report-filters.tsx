"use client";

import { Play, X } from "lucide-react";

import { Button } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useDepartments } from "@/hooks/use-hrm-settings";
import { type ReportFilterKey } from "@/lib/reports-config";
import { normalizeList } from "@/lib/api/drf";
import { type Department } from "@/lib/api/hrm-settings";

export interface ReportFilterValues {
  year?: string;
  month?: string;
  department?: string;
  region?: string;
  employee?: string;
  from_date?: string;
  to_date?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = (() => {
  const now = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(now - i));
})();

interface ReportFiltersProps {
  show: ReportFilterKey[];
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  onGenerate: () => void;
  onClear: () => void;
  loading?: boolean;
}

/** Shared report filter bar — renders only the filters a report declares. */
export function ReportFilters({
  show,
  values,
  onChange,
  onGenerate,
  onClear,
  loading,
}: ReportFiltersProps) {
  const wantsDepartment = show.includes("department");
  const wantsEmployee = show.includes("employee");
  const { data: deptData } = useDepartments(wantsDepartment ? { page_size: 200 } : undefined);
  const { options: employeeOptions } = useEmployeeOptions();
  const departments = normalizeList<Department>(deptData).results;

  const set = (key: keyof ReportFilterValues, v: string) => onChange({ ...values, [key]: v });

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 print:hidden">
      {show.includes("year") && (
        <Field label="Year" htmlFor="rpt-year" className="w-32">
          <Select id="rpt-year" value={values.year ?? ""} onChange={(e) => set("year", e.target.value)}>
            <option value="">Select…</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </Field>
      )}

      {show.includes("month") && (
        <Field label="Month" htmlFor="rpt-month" className="w-40">
          <Select id="rpt-month" value={values.month ?? ""} onChange={(e) => set("month", e.target.value)}>
            <option value="">Select…</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </Select>
        </Field>
      )}

      {wantsDepartment && (
        <Field label="Department" htmlFor="rpt-dept" className="w-48">
          <Select id="rpt-dept" value={values.department ?? ""} onChange={(e) => set("department", e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </Select>
        </Field>
      )}

      {wantsEmployee && (
        <Field label="Employee" htmlFor="rpt-emp" className="w-56">
          <Select id="rpt-emp" value={values.employee ?? ""} onChange={(e) => set("employee", e.target.value)}>
            <option value="">All employees</option>
            {employeeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      )}

      {show.includes("dateRange") && (
        <>
          <Field label="From" htmlFor="rpt-from" className="w-40">
            <Input id="rpt-from" type="date" value={values.from_date ?? ""} onChange={(e) => set("from_date", e.target.value)} />
          </Field>
          <Field label="To" htmlFor="rpt-to" className="w-40">
            <Input id="rpt-to" type="date" value={values.to_date ?? ""} onChange={(e) => set("to_date", e.target.value)} />
          </Field>
        </>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onGenerate} disabled={loading}>
          <Play className="mr-1.5 size-4" /> {loading ? "Generating…" : "Generate"}
        </Button>
        <Button size="sm" variant="outline" onClick={onClear} disabled={loading}>
          <X className="mr-1.5 size-4" /> Clear
        </Button>
      </div>
    </div>
  );
}
