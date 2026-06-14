"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useAttendanceRules,
  useDeleteAttendanceRule,
  useSaveAttendanceRule,
} from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type AttendanceRule } from "@/lib/api/attendance";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Rule Name", required: true },
  { name: "late_grace_minutes", label: "Late Grace (mins)", type: "number" },
  { name: "overtime_after_minutes", label: "Overtime After (mins)", type: "number" },
  { name: "half_day_threshold", label: "Half-Day Threshold (hrs)", type: "number", step: "0.5" },
  { name: "is_active", label: "Active", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function AttendanceRulesPage() {
  const { data, isLoading, error, refetch } = useAttendanceRules();
  const save = useSaveAttendanceRule();
  const del = useDeleteAttendanceRule();
  const rows = normalizeList<AttendanceRule>(data).results;

  const columns: Column<AttendanceRule>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name || "—"}</span> },
    { header: "Late Grace", cell: (r) => (r.late_grace_minutes != null ? `${r.late_grace_minutes}m` : "—") },
    { header: "Overtime After", cell: (r) => (r.overtime_after_minutes != null ? `${r.overtime_after_minutes}m` : "—") },
    {
      header: "Status",
      cell: (r) => (
        <Badge variant={r.is_active === false ? "secondary" : "success"}>
          {r.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Attendance Rules" subtitle="Lateness, overtime and half-day policies" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Attendance Rule"
        perms={{ add: "add_attendancerule", change: "change_attendancerule", delete: "delete_attendancerule" }}
        emptyDescription="No attendance rules configured yet."
        toForm={(r) => ({
          name: r?.name ?? "",
          late_grace_minutes: r?.late_grace_minutes ?? "",
          overtime_after_minutes: r?.overtime_after_minutes ?? "",
          half_day_threshold: r?.half_day_threshold ?? "",
          is_active: r?.is_active ?? true,
          description: r?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<AttendanceRule> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
