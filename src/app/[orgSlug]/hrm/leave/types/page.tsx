"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteLeaveCategory,
  useLeaveCategories,
  useSaveLeaveCategory,
} from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveCategory } from "@/lib/api/leave";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "max_days", label: "Max Days / Year", type: "number", step: "0.5" },
  { name: "is_paid", label: "Paid Leave", type: "switch" },
  { name: "carry_forward", label: "Allow Carry-Forward", type: "switch" },
  { name: "requires_approval", label: "Requires Approval", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function LeaveTypesPage() {
  const { data, isLoading, error, refetch } = useLeaveCategories();
  const save = useSaveLeaveCategory();
  const del = useDeleteLeaveCategory();
  const rows = normalizeList<LeaveCategory>(data).results;

  const columns: Column<LeaveCategory>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name || "—"}</span> },
    { header: "Max Days", cell: (c) => c.max_days ?? c.days_allowed ?? "—" },
    {
      header: "Paid",
      cell: (c) => (
        <Badge variant={c.is_paid ? "success" : "secondary"}>{c.is_paid ? "Paid" : "Unpaid"}</Badge>
      ),
    },
    {
      header: "Carry-Forward",
      cell: (c) => (c.carry_forward ? "Yes" : "No"),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Leave Types" subtitle="Configure leave categories and their rules" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Leave Type"
        perms={{ add: "add_leavecategory", change: "change_leavecategory", delete: "delete_leavecategory" }}
        emptyDescription="No leave types configured yet."
        toForm={(c) => ({
          name: c?.name ?? "",
          max_days: c?.max_days ?? "",
          is_paid: c?.is_paid ?? true,
          carry_forward: c?.carry_forward ?? false,
          requires_approval: c?.requires_approval ?? true,
          description: c?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<LeaveCategory> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
