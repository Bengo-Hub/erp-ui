"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, ChartCard, type ChartDatum } from "@/components/charts";
import { CardsSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { payrollApi } from "@/lib/api/payroll";

const thisMonth = new Date().toISOString().slice(0, 7);
const kes = (v: string | number) => `KES ${Math.round(Number(v) || 0).toLocaleString()}`;

/**
 * Labour cost by project: a payroll month's gross pay split with the same allocation rules the
 * payroll run posts to finance, so these figures match the project costs in Treasury.
 */
export default function LabourCostPage() {
  const [month, setMonth] = useState(thisMonth);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payroll", "labour-cost", month],
    queryFn: () => payrollApi.labourCost(month),
  });
  const chart: ChartDatum[] = (data?.projects ?? []).map((p) => ({ label: p.project_name, value: Number(p.amount) || 0 }));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Labour cost by project" subtitle="Gross pay for the month, split by each employee's project allocation" />
      <div className="flex items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block text-xs text-muted-foreground">Payroll month</span>
          <input
            type="month"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={month}
            max={thisMonth}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </label>
        {data && <p className="pb-2 text-sm text-muted-foreground">Total gross {kes(data.total_gross)}</p>}
      </div>

      {isLoading ? (
        <CardsSkeleton count={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <ChartCard title="Gross pay by project" empty={!chart.length}>
            <BarChart data={chart} />
          </ChartCard>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2 text-right">Gross pay</th>
                  <th className="px-4 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {(data?.projects ?? []).length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                      No payslips for this month.
                    </td>
                  </tr>
                )}
                {(data?.projects ?? []).map((p) => (
                  <tr key={p.project_id ?? "none"} className="border-b last:border-0">
                    <td className={p.project_id ? "px-4 py-2" : "px-4 py-2 italic text-muted-foreground"}>{p.project_name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{kes(p.amount)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.share_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Project allocations are set under Payroll, Project Allocations. Pay not allocated to a project is charged to the
            employee&apos;s department cost centre.
          </p>
        </>
      )}
    </div>
  );
}
