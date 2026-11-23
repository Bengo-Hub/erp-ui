"use client";

import { useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useMoney } from "@/hooks/use-money";
import { useDepartmentOptions } from "@/hooks/use-option-hooks";
import { useDeletePieceRate, usePieceRates, useSavePieceRate } from "@/hooks/use-piece-rate";
import { type PieceRate, type PieceRateInput } from "@/lib/api/piece-rate";
import { isoDay } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

import { usePayrollSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "code", label: "Code", required: true, placeholder: "e.g. SEW-SHIRT" },
  { name: "name", label: "Operation or item", required: true, placeholder: "e.g. Shirt sewn" },
  { name: "unit", label: "Unit", required: true, placeholder: "e.g. piece, kg, dozen" },
  { name: "rate", label: "Rate per unit", type: "number", step: "0.01", required: true },
  { name: "currency", label: "Currency", required: true },
  { name: "department_id", label: "Department", type: "combobox", optionsHook: useDepartmentOptions, placeholder: "All departments" },
  { name: "effective_from", label: "Effective from", type: "date", required: true },
  { name: "effective_to", label: "Effective to", type: "date" },
];

/** Pay per unit of work. A new rate from a later date keeps past output priced at the old rate. */
export default function PieceRatesPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("piece-rates");
  const { currency, format } = useMoney();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = usePieceRates({ page, limit: PAGE_SIZE });
  const save = useSavePieceRate();
  const del = useDeletePieceRate();
  const rows = data?.data ?? [];

  const columns: Column<PieceRate>[] = [
    {
      header: "Operation",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
        </div>
      ),
    },
    {
      header: "Rate",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (r) => `${format(r.rate, 2, r.currency)} per ${r.unit}`,
    },
    { header: "Department", cell: (r) => r.department_name || "All" },
    {
      header: "Effective",
      cell: (r) => (r.effective_to ? `${formatDate(r.effective_from)} to ${formatDate(r.effective_to)}` : `From ${formatDate(r.effective_from)}`),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Piece Rate"
        perms={{ add: "hrm.payroll.manage", change: "hrm.payroll.manage", delete: "hrm.payroll.manage" }}
        emptyDescription="Add a rate for each operation or item paid by the unit."
        toForm={(r) => ({
          code: r?.code ?? "",
          name: r?.name ?? "",
          unit: r?.unit ?? "piece",
          rate: r?.rate != null ? String(r.rate) : "",
          currency: r?.currency ?? currency,
          department_id: r?.department_id ?? "",
          effective_from: r?.effective_from?.slice(0, 10) ?? isoDay(),
          effective_to: r?.effective_to?.slice(0, 10) ?? "",
        })}
        onSave={({ id, data: v }, done) => {
          const payload: PieceRateInput = {
            code: String(v.code).trim(),
            name: String(v.name).trim(),
            unit: String(v.unit).trim(),
            rate: Number(v.rate),
            currency: String(v.currency).trim().toUpperCase(),
            department_id: v.department_id ? String(v.department_id) : null,
            effective_from: String(v.effective_from),
            effective_to: v.effective_to ? String(v.effective_to) : null,
          };
          save.mutate({ id: id as string | undefined, data: payload }, { onSuccess: done });
        }}
        onDelete={(id, done) => del.mutate(String(id), { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
        pagination={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
      />
    </div>
  );
}
