"use client";

import { useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDeleteOffDay, useOffDays, useSaveOffDay } from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type OffDay } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true, placeholder: "e.g. Public Holiday" },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "is_recurring", label: "Recurs Yearly", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function OffDaysPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOffDays({ page, page_size: PAGE_SIZE });
  const save = useSaveOffDay();
  const del = useDeleteOffDay();
  const { results: rows, count } = normalizeList<OffDay>(data);

  const columns: Column<OffDay>[] = [
    { header: "Name", cell: (o) => <span className="font-medium">{o.name || "—"}</span> },
    { header: "Date", cell: (o) => formatDate(o.date) },
    { header: "Recurring", cell: (o) => (o.is_recurring ? "Yes" : "No") },
    { header: "Description", cell: (o) => o.description || "—" },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Off Days & Holidays" subtitle="Non-working days and public holidays" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Off Day"
        perms={{ add: "add_offday", change: "change_offday", delete: "delete_offday" }}
        emptyDescription="No off days or holidays configured."
        toForm={(o) => ({
          name: o?.name ?? "",
          date: o?.date ?? "",
          is_recurring: o?.is_recurring ?? false,
          description: o?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<OffDay> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
        pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
      />
    </div>
  );
}
