"use client";

import {
  Banknote,
  CalendarClock,
  ClipboardCheck,
  Fingerprint,
  Receipt,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { AttendanceOverview } from "@/components/dashboard/attendance-overview";
import { MonthFigures } from "@/components/dashboard/month-figures";
import { WorkforceCharts } from "@/components/dashboard/workforce-charts";
import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { useAttendanceAnalytics, useHrmDashboard } from "@/hooks/use-dashboard";
import { useDashboardRoles } from "@/hooks/use-dashboard-roles";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";

interface QuickLink {
  href: string;
  icon: LucideIcon;
  label: string;
  show: boolean;
}

function QuickLinks({ links }: { links: QuickLink[] }) {
  const shown = links.filter((l) => l.show);
  if (!shown.length) return null;
  return (
    <nav aria-label="Shortcuts" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {shown.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Icon className="size-4 text-primary" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Executive dashboard: today's attendance first, then the month's overtime, piece output and
 * payroll, then the workforce charts. Each section shows only to the roles it serves.
 */
export default function DashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { getServiceTitle } = useBranding();
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName?.split(" ")[0] || "there";
  const roles = useDashboardRoles();

  const attendance = useAttendanceAnalytics(undefined, roles.analytics && (roles.hr || roles.security || roles.management));
  const hrm = useHrmDashboard(undefined, roles.analytics);
  const base = `/${orgSlug}`;

  const links: QuickLink[] = [
    { href: `${base}/hrm`, icon: TrendingUp, label: "HR analytics", show: roles.hr },
    { href: `${base}/hrm/attendance/records`, icon: ClipboardCheck, label: "Attendance", show: roles.hr },
    { href: `${base}/hrm/attendance/devices`, icon: Fingerprint, label: "Devices", show: roles.security },
    { href: `${base}/payroll/process`, icon: Banknote, label: "Run payroll", show: roles.management },
    { href: `${base}/reports`, icon: Receipt, label: "Reports", show: roles.analytics },
    { href: `${base}/hrm/employees`, icon: Users, label: "Employees", show: roles.hr },
    { href: `${base}/ess`, icon: UserRound, label: "My dashboard", show: true },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader title={`Welcome back, ${name}`} subtitle={`${getServiceTitle("HR")} dashboard`} />

      {roles.analytics ? (
        <>
          {(roles.hr || roles.security) && (
            <AttendanceOverview
              data={attendance.data}
              isLoading={attendance.isLoading}
              error={attendance.error}
              onRetry={() => attendance.refetch()}
              orgSlug={orgSlug}
              showDevices={roles.security}
              showCharts={roles.hr}
            />
          )}

          {(roles.hr || roles.management) && (
            <section aria-labelledby="month-heading" className="space-y-3">
              <h2 id="month-heading" className="text-base font-semibold text-foreground">
                This month
              </h2>
              <MonthFigures
                attendance={attendance.data}
                hrm={hrm.data}
                showPayroll={roles.management}
                isLoading={attendance.isLoading || hrm.isLoading}
              />
            </section>
          )}

          <section aria-labelledby="workforce-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="workforce-heading" className="text-base font-semibold text-foreground">
                Workforce
              </h2>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {hrm.data?.headcount_metrics?.total_employees ?? "—"}
                  </span>{" "}
                  employees
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" aria-hidden />
                  <span className="font-semibold tabular-nums text-foreground">
                    {hrm.data?.leave_metrics?.pending_requests ?? "—"}
                  </span>{" "}
                  leave requests waiting
                </span>
              </div>
            </div>
            <WorkforceCharts data={hrm.data} showPayroll={roles.management} variant="executive" />
          </section>
        </>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <p className="text-sm text-foreground">Clock in, apply for leave and download payslips from your own dashboard.</p>
          <Link
            href={`${base}/ess`}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Open my dashboard
          </Link>
        </Card>
      )}

      <QuickLinks links={links} />
    </div>
  );
}
