"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useDeleteLeaveEntitlement,
  useLeaveCategories,
  useLeaveEntitlements,
  useSaveLeaveEntitlement,
} from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveCategory, type LeaveEntitlement } from "@/lib/api/leave";

export default function LeaveEntitlementPage() {
  const { data, isLoading, error, refetch } = useLeaveEntitlements();
  const { options: employees } = useEmployeeOptions();
  const { data: catData } = useLeaveCategories({ page_size: 200 });
  const categories = normalizeList<LeaveCategory>(catData).results;
  const save = useSaveLeaveEntitlement();
  const del = useDeleteLeaveEntitlement();
  const rows = normalizeList<LeaveEntitlement>(data).results;

  const fields: CrudFieldDef[] = [
    { name: "employee", label: "Employee", type: "select", options: employees, required: true },
    {
      name: "leave_category",
      label: "Leave Type",
      type: "select",
      required: true,
      options: categories.map((c) => ({ value: String(c.id), label: c.name ?? `#${c.id}` })),
    },
    { name: "days", label: "Days", type: "number", step: "0.5", required: true },
    { name: "year", label: "Year", type: "number" },
  ];

  const columns: Column<LeaveEntitlement>[] = [
    {
      header: "Employee",
      cell: (e) => <span className="font-medium">{e.employee_name || e.employee || "—"}</span>,
    },
    { header: "Leave Type", cell: (e) => e.leave_category_name || "—" },
    { header: "Days", cell: (e) => e.days ?? "—" },
    { header: "Year", cell: (e) => e.year ?? "—" },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Leave Entitlement" subtitle="Per-employee annual leave allocations" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Entitlement"
        perms={{ add: "add_leaveentitlement", change: "change_leaveentitlement", delete: "delete_leaveentitlement" }}
        emptyDescription="No leave entitlements have been allocated."
        toForm={(e) => ({
          employee: e?.employee ?? "",
          leave_category: e?.leave_category ?? "",
          days: e?.days ?? "",
          year: e?.year ?? new Date().getFullYear(),
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                ...data,
                employee: data.employee ? Number(data.employee) : undefined,
                leave_category: data.leave_category ? Number(data.leave_category) : undefined,
              } as Partial<LeaveEntitlement>,
            },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
