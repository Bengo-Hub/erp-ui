"use client";

import { useState } from "react";

import { Card } from "@/components/ui/base";
import { EmptyState } from "@/components/ui/states";

/** Rows for the accessible table view of a chart. */
export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
  subtitle?: string;
  /** When given, a "Table" toggle shows the same numbers as a table. */
  table?: ChartTable;
  emptyDescription?: string;
  /** Plot height class, default h-64. */
  heightClass?: string;
}

/** Card wrapper with a title, empty-state guard and optional table view for charts. */
export function ChartCard({ title, children, empty, subtitle, table, emptyDescription, heightClass = "h-64" }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className="min-w-0 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {table && !empty && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {empty ? (
        <EmptyState title="No data yet" description={emptyDescription ?? "This chart will populate as data accrues."} />
      ) : showTable && table ? (
        <div className={`${heightClass} overflow-auto`}>
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {table.columns.map((c) => (
                  <th key={c} className="py-1.5 pr-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60">
                  {r.map((cell, j) => (
                    <td key={j} className="py-1.5 pr-3 text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={heightClass}>{children}</div>
      )}
    </Card>
  );
}

export interface ChartDatum {
  label: string;
  value: number;
}
