"use client";

import { CalendarClock, FileWarning, TrendingUp, UserPlus, Users } from "lucide-react";

import { BarChart, BreakdownChart, ChartCard, type ChartDatum } from "@/components/charts";
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

  const gender: ChartDatum[] = (data?.demographics?.gender_distribution ?? []).map((g) => ({
    label: g.personal_details__gender || "Unknown",
    value: g.count ?? 0,
  }));
  const byDeptRaw: Record<string, unknown>[] =
    data?.headcount_by_department ??
    data?.salary_analysis?.salary_by_department?.map((d) => ({
      label: d.department__name,
      value: d.total,
    })) ??
    [];
  const byDept: ChartDatum[] = byDeptRaw.map((d) => ({
    label: String(d.label ?? d.name ?? "—"),
    value: Number(d.value ?? d.count ?? 0),
  }));

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
              trend={pctChange(head?.total_employees, head?.previous_total)}
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

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Headcount by department" empty={!byDept.length}>
              <BarChart data={byDept} />
            </ChartCard>
            <ChartCard title="Gender distribution" empty={!gender.length}>
              <BreakdownChart data={gender} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
