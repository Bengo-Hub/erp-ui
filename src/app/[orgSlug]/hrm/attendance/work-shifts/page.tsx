"use client";

import { useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge, Button } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDeleteWorkShift, useSaveWorkShift, useWorkShifts } from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type WorkShift } from "@/lib/api/attendance";
import { ScheduleDialog } from "./_schedule-dialog";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Shift Name", required: true },
  { name: "start_time", label: "Start Time", placeholder: "08:00" },
  { name: "end_time", label: "End Time", placeholder: "17:00" },
  { name: "break_duration", label: "Break (mins)", type: "number" },
  { name: "grace_period", label: "Grace (mins)", type: "number" },
  { name: "is_active", label: "Active", type: "switch" },
];

export default function WorkShiftsPage() {
  const { data, isLoading, error, refetch } = useWorkShifts();
  const save = useSaveWorkShift();
  const del = useDeleteWorkShift();
  const rows = normalizeList<WorkShift>(data).results;
  const [scheduleFor, setScheduleFor] = useState<WorkShift | null>(null);

  const columns: Column<WorkShift>[] = [
    { header: "Name", cell: (s) => <span className="font-medium">{s.name || "—"}</span> },
    { header: "Start", cell: (s) => s.start_time || "—" },
    { header: "End", cell: (s) => s.end_time || "—" },
    { header: "Break", cell: (s) => (s.break_duration != null ? `${s.break_duration}m` : "—") },
    {
      header: "Status",
      cell: (s) => (
        <Badge variant={s.is_active === false ? "secondary" : "success"}>
          {s.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Schedule",
      cell: (s) => (
        <Button size="sm" variant="secondary" onClick={() => setScheduleFor(s)}>
          Weekly hours
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Work Shifts" subtitle="Define working-hour patterns" />
      <ScheduleDialog shift={scheduleFor} onClose={() => setScheduleFor(null)} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Work Shift"
        perms={{ add: "add_workshift", change: "change_workshift", delete: "delete_workshift" }}
        emptyDescription="No work shifts defined yet."
        toForm={(s) => ({
          name: s?.name ?? "",
          start_time: s?.start_time ?? "",
          end_time: s?.end_time ?? "",
          break_duration: s?.break_duration ?? "",
          grace_period: s?.grace_period ?? "",
          is_active: s?.is_active ?? true,
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<WorkShift> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
