"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { normalizeList } from "@/lib/api/drf";
import { type PayComponentRecord } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

interface RecordHooks {
  list: () => { data: unknown; isLoading: boolean; error: unknown; refetch: () => void };
  save: () => {
    mutate: (
      a: { id?: number | string; data: Partial<PayComponentRecord> },
      o?: { onSuccess?: () => void },
    ) => void;
    isPending: boolean;
  };
  remove: () => { mutate: (id: number | string, o?: { onSuccess?: () => void }) => void; isPending: boolean };
}

const fields: CrudFieldDef[] = [
  { name: "employee", label: "Employee", type: "combobox", optionsHook: useEmployeeOptions, required: true, placeholder: "Select employee" },
  { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
  { name: "date", label: "Date", type: "date" },
  { name: "reason", label: "Reason", span2: true },
  { name: "description", label: "Description", type: "richtext", span2: true },
];

/** Shared editor for salary advances and losses/damages (same record shape). */
export function PayRecordManager({
  title,
  subtitle,
  entityLabel,
  hooks,
  perms,
}: {
  title: string;
  subtitle: string;
  entityLabel: string;
  hooks: RecordHooks;
  perms?: { add?: string; change?: string; delete?: string };
}) {
  const { data, isLoading, error, refetch } = hooks.list();
  const save = hooks.save();
  const del = hooks.remove();
  const rows = normalizeList<PayComponentRecord>(data as PayComponentRecord[] | undefined).results;

  const columns: Column<PayComponentRecord>[] = [
    {
      header: "Employee",
      cell: (r) => <span className="font-medium">{r.employee_name || r.employee || "—"}</span>,
    },
    {
      header: "Amount",
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.amount),
    },
    { header: "Reason", cell: (r) => r.reason || r.description || "—" },
    { header: "Date", cell: (r) => formatDate(r.date) },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title={title} subtitle={subtitle} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel={entityLabel}
        perms={perms}
        toForm={(r) => ({
          employee: r?.employee ?? "",
          amount: r?.amount ?? "",
          date: r?.date ?? "",
          reason: r?.reason ?? "",
          description: r?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                ...data,
                employee: data.employee ? Number(data.employee) : undefined,
              } as Partial<PayComponentRecord>,
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
