"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteProjectAllocation,
  useProjectAllocations,
  useSaveProjectAllocation,
} from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type ProjectAllocation } from "@/lib/api/payroll";

const fields: CrudFieldDef[] = [
  { name: "employee_id", label: "Employee / Consultant ID", required: true },
  { name: "project_id", label: "Project ID", required: true },
  { name: "project_name", label: "Project Name" },
  { name: "allocation_percent", label: "Allocation %", type: "number", step: "0.01" },
  { name: "fixed_amount", label: "Fixed Amount (optional)", type: "number", step: "0.01" },
  { name: "cost_center_id", label: "Cost Center ID (optional)" },
];

/**
 * Employee ↔ Project Allocations — ties employees and consultants to the projects they work on,
 * with a % (or fixed) share per project. A consultant on multiple projects has one row per project
 * (each with its own dates/completion), the basis for attributing their pay across projects.
 */
export default function ProjectAllocationsPage() {
  const { data, isLoading, error, refetch } = useProjectAllocations();
  const save = useSaveProjectAllocation();
  const del = useDeleteProjectAllocation();
  const rows = normalizeList<ProjectAllocation>(data).results;

  const columns: Column<ProjectAllocation>[] = [
    { header: "Employee", cell: (a) => <span className="font-medium">{String(a.employee_id || "—").slice(0, 8)}</span> },
    { header: "Project", cell: (a) => a.project_name || String(a.project_id || "—").slice(0, 8) },
    { header: "Allocation %", className: "text-right", headerClassName: "text-right", cell: (a) => `${Number(a.allocation_percent ?? 0)}%` },
    { header: "Fixed", className: "text-right", headerClassName: "text-right", cell: (a) => (a.fixed_amount ? Number(a.fixed_amount).toLocaleString() : "—") },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Project Allocations" subtitle="Tie employees & consultants to projects (split their pay across projects)" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Allocation"
        emptyDescription="No project allocations yet. Add one to attribute an employee/consultant's pay to a project."
        toForm={(a) => ({
          employee_id: a?.employee_id ?? "",
          project_id: a?.project_id ?? "",
          project_name: a?.project_name ?? "",
          allocation_percent: a?.allocation_percent ?? "",
          fixed_amount: a?.fixed_amount ?? "",
          cost_center_id: a?.cost_center_id ?? "",
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<ProjectAllocation> }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
