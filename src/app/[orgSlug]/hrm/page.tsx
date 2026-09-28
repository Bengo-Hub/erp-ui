"use client";

import { CalendarClock, FileWarning, Timer, TrendingDown, TrendingUp, UserMinus, UserPlus, Users, Wallet } from "lucide-react";

import { BarChart, BreakdownChart, ChartCard, TrendChart, type ChartDatum } from "@/components/charts";
import { CardsSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { useHrmDashboard } from "@/hooks/use-dashboard";

function pctChange(curr?: number, prev?: number): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export default function HrmDashboardPage() {
  const { data, isLoading, error, refetch } = useHrmDashboard();

  const head = data?.headcount_metrics;
  const att = data?.attendance_metrics;
  const leave = data?.leave_metrics;
  const wf = data?.workforce;

  const gender: ChartDatum[] = (data?.demographics?.gender_distribution ?? []).map((g) => ({
    label: g.personal_details__gender || "Unknown",
    value: g.count ?? 0,
  }));
  const toData = (rows?: Record<string, unknown>[]): ChartDatum[] =>
    (rows ?? []).map((d) => ({ label: String(d.label ?? d.name ?? "—"), value: Number(d.value ?? d.count ?? 0) }));
  const byDept = toData(data?.headcount_by_department);
  const payrollByDept = toData(data?.payroll_by_department);
  const employmentTypes = toData(data?.demographics?.employment_types);
  const payrollTrend: ChartDatum[] = (data?.payroll_trend ?? []).map((p) => ({ label: p.month, value: p.gross }));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="HR Dashboard" subtitle="Headcount, attendance, leave & payroll at a glance" />

      {isLoading ? (
        <CardsSkeleton count={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Total Employees"
              value={head?.total_employees ?? "—"}
              icon={Users}
            />
            <StatTile
              label="Attendance Rate"
              value={att?.attendance_rate != null ? `${att.attendance_rate}%` : "—"}
              icon={CalendarClock}
              accent="text-green-600"
              trend={pctChange(att?.attendance_rate, att?.previous_rate)}
            />
            <StatTile
              label="Leave Approval"
              value={leave?.approval_rate != null ? `${leave.approval_rate}%` : "—"}
              icon={TrendingUp}
              accent="text-primary"
              trend={pctChange(leave?.approval_rate, leave?.previous_approval_rate)}
            />
            <StatTile
              label="New Hires"
              value={head?.new_hires ?? "—"}
              icon={UserPlus}
              accent="text-primary"
            />
            <StatTile
              label="Expiring Contracts"
              value={head?.expiring_contracts ?? "—"}
              icon={FileWarning}
              accent="text-yellow-600"
            />
          </div>

          {wf && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Exits this period" value={wf.exits} icon={UserMinus} />
              <StatTile
                label="Turnover"
                value={wf.turnover_pct != null ? `${wf.turnover_pct}%` : "—"}
                icon={TrendingDown}
                accent={wf.turnover_pct != null && wf.turnover_pct > 10 ? "text-red-600" : undefined}
              />
              <StatTile
                label="Overtime hours"
                value={(wf.overtime_attendance_hours + wf.overtime_timesheet_hours).toLocaleString()}
                icon={Timer}
              />
              <StatTile
                label="Leave liability"
                value={`KES ${Math.round(wf.leave_liability).toLocaleString()}`}
                icon={Wallet}
                accent="text-yellow-600"
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Headcount by department" empty={!byDept.length}>
              <BarChart data={byDept} />
            </ChartCard>
            <ChartCard title="Gender distribution" empty={!gender.length}>
              <BreakdownChart data={gender} />
            </ChartCard>
            <ChartCard title="Payroll cost, last 12 months (gross)" empty={!payrollTrend.length}>
              <TrendChart data={payrollTrend} />
            </ChartCard>
            <ChartCard title="Payroll by department (latest month)" empty={!payrollByDept.length}>
              <BarChart data={payrollByDept} />
            </ChartCard>
            <ChartCard title="Employment type" empty={!employmentTypes.length}>
              <BreakdownChart data={employmentTypes} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
