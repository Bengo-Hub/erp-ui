"use client";

import { useMemo, useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDeleteOffDay, useOffDays, useSaveOffDay } from "@/hooks/use-attendance";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { normalizeList } from "@/lib/api/drf";
import { type OffDay } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  {
    name: "employee_id",
    label: "Employee",
    type: "combobox",
    required: true,
    optionsHook: useEmployeeOptions,
    placeholder: "Search employees…",
  },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "reason", label: "Reason", type: "textarea", span2: true, placeholder: "e.g. Family event, compensating a weekend shift" },
];

/** Dates arrive as RFC 3339; the date input wants YYYY-MM-DD. */
const dateOnly = (v?: string) => (v ? v.slice(0, 10) : "");

export default function OffDaysPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOffDays({ page, page_size: PAGE_SIZE });
  const { options: employees } = useEmployeeOptions();
  const save = useSaveOffDay();
  const del = useDeleteOffDay();
  const { results: rows, count } = normalizeList<OffDay>(data);

  const nameOf = useMemo(() => {
    const m = new Map(employees.map((o) => [o.value, o.label]));
    return (o: OffDay) => o.employee_name || (o.employee_id ? m.get(String(o.employee_id)) : undefined) || "—";
  }, [employees]);

  const columns: Column<OffDay>[] = [
    {
      header: "Employee",
      cell: (o) => (
        <div>
          <span className="font-medium">{nameOf(o)}</span>
          {o.employee_number ? <span className="block text-xs text-muted-foreground">{o.employee_number}</span> : null}
        </div>
      ),
    },
    { header: "Date", cell: (o) => formatDate(o.date) },
    { header: "Reason", cell: (o) => o.reason || "—" },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Off Days" subtitle="Days off granted to individual employees" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Off Day"
        perms={{ add: "add_offday", change: "change_offday", delete: "delete_offday" }}
        emptyDescription="No off days granted yet."
        toForm={(o) => ({
          employee_id: o?.employee_id ?? "",
          date: dateOnly(o?.date),
          reason: o?.reason ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                employee_id: String(data.employee_id ?? ""),
                date: String(data.date ?? ""),
                reason: String(data.reason ?? "").trim(),
              },
            },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
        pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
      />
    </div>
  );
}
