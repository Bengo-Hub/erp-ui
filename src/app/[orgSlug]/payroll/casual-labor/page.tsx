"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge, Button } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useApproveCasualLabor,
  useCasualLabor,
  useDeleteCasualLabor,
  useSaveCasualLabor,
} from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type CasualLabor } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "worker_name", label: "Worker / Hired Skill", required: true },
  { name: "worker_id_number", label: "National ID / Ref" },
  { name: "worker_phone", label: "Phone" },
  { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
  { name: "payment_method", label: "Payment Method" },
  { name: "engaged_by_employee_id", label: "Engaged By (Employee ID)" },
  { name: "project_id", label: "Project ID (optional)" },
  { name: "cost_center_id", label: "Cost Center ID (optional)" },
  { name: "task_description", label: "Task Description", type: "textarea", span2: true },
];

/**
 * Casual / Subcontracted Labour — a documented, approvable register of casual workers (or hired
 * skills) engaged for a task, e.g. by a project manager or consultant who is then reimbursed.
 * Approving posts the cost to finance (DR Casual Labour / CR payable) attributed to the project.
 */
export default function CasualLaborPage() {
  const { data, isLoading, error, refetch } = useCasualLabor();
  const save = useSaveCasualLabor();
  const del = useDeleteCasualLabor();
  const approve = useApproveCasualLabor();
  const rows = normalizeList<CasualLabor>(data).results;

  const columns: Column<CasualLabor>[] = [
    { header: "Worker", cell: (c) => <span className="font-medium">{c.worker_name || "—"}</span> },
    { header: "Task", cell: (c) => (c.task_description ? String(c.task_description).slice(0, 40) : "—") },
    { header: "Amount", className: "text-right", headerClassName: "text-right", cell: (c) => formatMoney(c.amount) },
    { header: "Date", cell: (c) => formatDate(c.created_at) },
    {
      header: "Status",
      cell: (c) => {
        const v = (c.status || "pending").toLowerCase();
        return (
          <Badge variant={v === "approved" || v === "paid" ? "success" : v === "rejected" ? "error" : "warning"}>
            {c.status || "Pending"}
          </Badge>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) =>
        c.status === "approved" || c.status === "paid" ? null : (
          <Button size="sm" variant="ghost" disabled={approve.isPending} onClick={() => approve.mutate(c.id)} title="Approve — posts the cost to finance">
            Approve
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Casual / Subcontracted Labour" subtitle="Documented casual-worker engagements with approval + finance posting" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Casual Labour Record"
        emptyDescription="No casual-labour records yet."
        toForm={(c) => ({
          worker_name: c?.worker_name ?? "",
          worker_id_number: c?.worker_id_number ?? "",
          worker_phone: c?.worker_phone ?? "",
          amount: c?.amount ?? "",
          payment_method: c?.payment_method ?? "",
          engaged_by_employee_id: c?.engaged_by_employee_id ?? "",
          project_id: c?.project_id ?? "",
          cost_center_id: c?.cost_center_id ?? "",
          task_description: c?.task_description ?? "",
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<CasualLabor> }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
