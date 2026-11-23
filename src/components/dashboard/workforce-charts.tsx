"use client";

import { BarChart, BreakdownChart, ChartCard, TrendChart, type ChartDatum } from "@/components/charts";
import { useMoney } from "@/hooks/use-money";
import { type HrmDashboard, type MetricBucket } from "@/lib/api/analytics";

const toData = (rows?: MetricBucket[]): ChartDatum[] =>
  (rows ?? []).map((d) => ({ label: String(d.label ?? d.name ?? "Other"), value: Number(d.value ?? d.count ?? 0) }));

const tableOf = (data: ChartDatum[], header: string, fmt: (v: number) => string | number = (v) => v) => ({
  columns: [header, "Value"],
  rows: data.map((d) => [d.label, fmt(d.value)]),
});

/**
 * Headcount and payroll charts from hrm-analytics. `variant="executive"` keeps the two charts a
 * leadership view needs; `"hr"` adds the demographic breakdowns.
 */
export function WorkforceCharts({
  data,
  showPayroll,
  variant,
}: {
  data: HrmDashboard | undefined;
  showPayroll: boolean;
  variant: "executive" | "hr";
}) {
  const { format } = useMoney();
  const byDept = toData(data?.headcount_by_department);
  const payrollByDept = toData(data?.payroll_by_department);
  const payrollTrend: ChartDatum[] = (data?.payroll_trend ?? []).map((p) => ({ label: p.month, value: p.gross }));
  const gender: ChartDatum[] = (data?.demographics?.gender_distribution ?? []).map((g) => ({
    label: g.personal_details__gender || "Not recorded",
    value: g.count ?? 0,
  }));
  const employmentTypes = toData(data?.demographics?.employment_types);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Headcount by department" empty={!byDept.length} table={tableOf(byDept, "Department")}>
        <BarChart data={byDept} />
      </ChartCard>
      {showPayroll && (
        <ChartCard
          title="Payroll cost, last 12 months"
          subtitle="Gross pay per month"
          empty={!payrollTrend.length}
          table={tableOf(payrollTrend, "Month", (v) => format(v))}
        >
          <TrendChart data={payrollTrend} />
        </ChartCard>
      )}
      {variant === "hr" && showPayroll && (
        <ChartCard
          title="Payroll by department"
          subtitle="Latest month"
          empty={!payrollByDept.length}
          table={tableOf(payrollByDept, "Department", (v) => format(v))}
        >
          <BarChart data={payrollByDept} />
        </ChartCard>
      )}
      {variant === "hr" && (
        <>
          <ChartCard title="Gender distribution" empty={!gender.length} table={tableOf(gender, "Gender")}>
            <BreakdownChart data={gender} />
          </ChartCard>
          <ChartCard title="Employment type" empty={!employmentTypes.length} table={tableOf(employmentTypes, "Type")}>
            <BreakdownChart data={employmentTypes} />
          </ChartCard>
        </>
      )}
    </div>
  );
}
