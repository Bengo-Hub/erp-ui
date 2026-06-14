"use client";

import { Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { type PayrollPreviewRow } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

/** Read-only preview of computed payroll lines before committing the run. */
export function PreviewTable({
  rows,
  isLoading,
  error,
}: {
  rows: PayrollPreviewRow[];
  isLoading?: boolean;
  error?: unknown;
}) {
  const totals = rows.reduce<{ gross: number; deductions: number; net: number }>(
    (acc, r) => ({
      gross: acc.gross + num(r.gross_pay),
      deductions: acc.deductions + num(r.total_deductions),
      net: acc.net + num(r.net_pay),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  const columns: Column<PayrollPreviewRow>[] = [
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name || r.employee || "—"}</span> },
    { header: "Gross", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.gross_pay) },
    { header: "PAYE", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.paye) },
    { header: "NSSF", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.nssf) },
    { header: "SHIF", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.shif) },
    {
      header: "Housing",
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.housing_levy),
    },
    {
      header: "Net Pay",
      className: "text-right font-semibold",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.net_pay),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Gross" value={formatMoney(totals.gross)} />
        <SummaryCard label="Total Deductions" value={formatMoney(totals.deductions)} />
        <SummaryCard label="Total Net Pay" value={formatMoney(totals.net)} emphasize />
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => String(r.employee ?? r.employee_name ?? Math.random())}
          isLoading={isLoading}
          error={error}
          emptyTitle="No employees to preview"
          emptyDescription="No eligible employees for the selected period and type."
        />
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <Card>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={emphasize ? "mt-1 text-xl font-bold text-primary" : "mt-1 text-xl font-bold text-foreground"}>
          {value}
        </p>
      </div>
    </Card>
  );
}
