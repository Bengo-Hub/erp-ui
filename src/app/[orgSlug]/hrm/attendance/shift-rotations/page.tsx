"use client";

import { useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteShiftRotation,
  useSaveShiftRotation,
  useShiftRotations,
} from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type ShiftRotation } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";

const fields: CrudFieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "rotation_period", label: "Rotation Period (days)", type: "number" },
  { name: "is_active", label: "Active", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function ShiftRotationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useShiftRotations({ page, page_size: PAGE_SIZE });
  const save = useSaveShiftRotation();
  const del = useDeleteShiftRotation();
  const { results: rows, count } = normalizeList<ShiftRotation>(data);

  const columns: Column<ShiftRotation>[] = [
    { header: "Title", cell: (r) => <span className="font-medium">{r.title || r.name || "—"}</span> },
    { header: "Period", cell: (r) => (r.rotation_period != null ? `${r.rotation_period} days` : "—") },
    { header: "Description", cell: (r) => r.description || "—" },
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
      <PageHeader title="Shift Rotations" subtitle="Rotating shift schedules for teams" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Shift Rotation"
        perms={{ add: "add_shiftrotation", change: "change_shiftrotation", delete: "delete_shiftrotation" }}
        emptyDescription="No shift rotations defined yet."
        toForm={(r) => ({
          title: r?.title ?? r?.name ?? "",
          rotation_period: r?.rotation_period ?? "",
          is_active: r?.is_active ?? true,
          description: r?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<ShiftRotation> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
        pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
      />
    </div>
  );
}
