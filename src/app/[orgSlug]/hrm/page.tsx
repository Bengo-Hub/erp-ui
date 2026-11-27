"use client";

import { CalendarClock, FileWarning, TrendingDown, UserMinus, UserPlus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { AttendanceOverview } from "@/components/dashboard/attendance-overview";
import { MonthFigures } from "@/components/dashboard/month-figures";
import { WorkforceCharts } from "@/components/dashboard/workforce-charts";
import { CardsSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { useAttendanceAnalytics, useHrmDashboard } from "@/hooks/use-dashboard";
import { useDashboardRoles } from "@/hooks/use-dashboard-roles";
import { useMoney } from "@/hooks/use-money";
import { formatNumber, formatPercent } from "@/lib/format";

/** HR dashboard: today's attendance, people movements, the month's totals and workforce charts. */
export default function HrmDashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const roles = useDashboardRoles();
  const { format } = useMoney();
  const attendance = useAttendanceAnalytics(undefined, roles.analytics);
  const { data, isLoading, error, refetch } = useHrmDashboard(undefined, roles.analytics);

  const head = data?.headcount_metrics;
  const leave = data?.leave_metrics;
  const wf = data?.workforce;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader title="HR Dashboard" subtitle="Attendance, people, leave and payroll at a glance" />

      <AttendanceOverview
        data={attendance.data}
        isLoading={attendance.isLoading}
        error={attendance.error}
        onRetry={() => attendance.refetch()}
        orgSlug={orgSlug}
        showDevices={roles.security}
        showCharts
      />

      <section aria-labelledby="people-heading" className="space-y-3">
        <h2 id="people-heading" className="text-base font-semibold text-foreground">
          People
        </h2>
        {isLoading ? (
          <CardsSkeleton count={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Employees" value={head?.total_employees ?? "—"} icon={Users} />
            <StatTile label="New hires this month" value={head?.new_hires ?? "—"} icon={UserPlus} />
            <StatTile
              label="Contracts ending in 30 days"
              value={head?.expiring_contracts ?? "—"}
              icon={FileWarning}
              hint={head?.expiring_90 != null ? `${head.expiring_90} within 90 days` : undefined}
            />
            <StatTile label="Leave requests waiting" value={leave?.pending_requests ?? "—"} icon={CalendarClock} />
            {wf && (
              <>
                <StatTile label="Exits this period" value={wf.exits} icon={UserMinus} />
                <StatTile
                  label="Turnover"
                  value={wf.turnover_pct != null ? formatPercent(wf.turnover_pct) : "—"}
                  icon={TrendingDown}
                />
                {roles.management && (
                  <StatTile
                    label="Leave liability"
                    value={format(wf.leave_liability)}
                    icon={Wallet}
                    hint={`${formatNumber(wf.leave_days_remaining, 0)} leave days outstanding`}
                  />
                )}
              </>
            )}
          </div>
        )}
      </section>

      {data?.login_disabled && data.login_disabled.length > 0 && (
        <section aria-labelledby="login-disabled-heading" className="space-y-3">
          <h2 id="login-disabled-heading" className="text-base font-semibold text-foreground">
            Login disabled, review exit
          </h2>
          <p className="text-sm text-muted-foreground">
            These employees can no longer sign in. They are still on payroll: if they have left, open their profile, choose Mark as
            exited and run their final pay. If not, restore their login under Users.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {data.login_disabled.map((e) => (
              <li key={e.employee_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <Link href={`/${orgSlug}/hrm/employees/${e.employee_id}`} className="font-medium text-primary hover:underline">
                  {e.name || "Unnamed employee"}
                  {e.employee_number ? <span className="ml-2 text-muted-foreground">{e.employee_number}</span> : null}
                </Link>
                <span className="text-muted-foreground">
                  Login {e.status || "disabled"}
                  {e.since ? ` since ${new Date(e.since).toLocaleDateString()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="month-heading" className="space-y-3">
        <h2 id="month-heading" className="text-base font-semibold text-foreground">
          This month
        </h2>
        <MonthFigures
          attendance={attendance.data}
          hrm={data}
          showPayroll={roles.management}
          isLoading={attendance.isLoading || isLoading}
        />
      </section>

      <section aria-labelledby="workforce-heading" className="space-y-3">
        <h2 id="workforce-heading" className="text-base font-semibold text-foreground">
          Workforce
        </h2>
        <WorkforceCharts data={data} showPayroll={roles.management} variant="hr" />
      </section>
    </div>
  );
}
