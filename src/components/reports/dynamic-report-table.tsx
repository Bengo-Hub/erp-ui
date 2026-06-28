"use client";

import { type ReportColumnDef, type ReportRow } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Backend-driven report table for reports whose columns vary per tenant (e.g. the muster roll's
 * per-payroll-component columns). Horizontally scrollable, the first column pinned, with a
 * Grand Totals footer sourced from the report `totals` map.
 */
export function DynamicReportTable({
  columns,
  rows,
  totals,
}: {
  columns: ReportColumnDef[];
  rows: ReportRow[];
  totals?: Record<string, unknown>;
}) {
  const fmt = (c: ReportColumnDef, v: unknown) =>
    c.money
      ? formatCurrency(v as string | number | null)
      : v == null || v === ""
        ? "—"
        : String(v);
  const alignRight = (c: ReportColumnDef) => c.money || c.numeric;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((c, i) => (
              <th
                key={c.key}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  alignRight(c) ? "text-right" : "text-left",
                  i === 0 && "sticky left-0 z-10 bg-muted/50",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-border/60 hover:bg-muted/20">
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-3 py-2",
                    alignRight(c) ? "text-right tabular-nums" : "",
                    i === 0 && "sticky left-0 z-10 bg-background font-medium",
                  )}
                >
                  {fmt(c, r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/60 font-semibold">
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-3 py-2",
                    alignRight(c) ? "text-right tabular-nums" : "",
                    i === 0 && "sticky left-0 z-10 bg-muted/60",
                  )}
                >
                  {i === 0
                    ? "Grand Totals"
                    : alignRight(c) && totals[c.key] != null
                      ? fmt(c, totals[c.key])
                      : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
