"use client";

import { Banknote, CalendarClock, Receipt, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { BarChart, ChartCard, type ChartDatum } from "@/components/charts";
import { Button } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { useHrmDashboard } from "@/hooks/use-dashboard";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@/lib/format";

const money = (v?: number) => formatCurrency(v, "KES", 0);

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof Users; label: string }) {
  return (
    <Link href={href}>
      <Button variant="outline" className="h-full w-full justify-start gap-2">
        <Icon className="size-4" /> {label}
      </Button>
    </Link>
  );
}

/** Executive dashboard — live HRM + payroll headline metrics. */
export default function DashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { getServiceTitle } = useBranding();
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName?.split(" ")[0] || "there";

  const { data, isLoading } = useHrmDashboard();
  const head = data?.headcount_metrics;
  const pay = data?.payroll_metrics;
  const leave = data?.leave_metrics;

  const byDept: ChartDatum[] = ((data?.headcount_by_department ?? []) as Record<string, unknown>[]).map(
    (d) => ({
      label: String(d.label ?? d.name ?? "—"),
      value: Number(d.value ?? d.count ?? 0),
    }),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title={`Welcome back, ${name}`} subtitle={`${getServiceTitle("HR")} dashboard`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Employees" value={isLoading ? "…" : (head?.total_employees ?? "—")} icon={Users} hint="Headcount" />
        <StatTile label="Pending Leave" value={isLoading ? "…" : (leave?.pending_requests ?? "—")} icon={CalendarClock} hint="Awaiting approval" accent="text-yellow-600" />
        <StatTile label="Payroll (Net)" value={isLoading ? "…" : money(pay?.total_net_pay)} icon={Banknote} hint="Current period" accent="text-green-600" />
        <StatTile label="Total PAYE" value={isLoading ? "…" : money(pay?.total_paye)} icon={Receipt} hint="Current period" accent="text-primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Headcount by department" empty={!isLoading && !byDept.length}>
          <BarChart data={byDept} />
        </ChartCard>
        <ChartCard title="Quick links" empty={false}>
          <div className="grid h-full grid-cols-2 content-start gap-3">
            <QuickLink href={`/${orgSlug}/hrm`} icon={TrendingUp} label="HR analytics" />
            <QuickLink href={`/${orgSlug}/payroll/process`} icon={Banknote} label="Run payroll" />
            <QuickLink href={`/${orgSlug}/reports`} icon={Receipt} label="Reports" />
            <QuickLink href={`/${orgSlug}/hrm/employees`} icon={Users} label="Employees" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
