"use client";

import {
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  FileText,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { useLeaveBalances } from "@/hooks/use-leave";
import { usePayslips } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { useAuthStore } from "@/store/auth";

interface QuickAction {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
}

export default function EssDashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName?.split(" ")[0] || "there";

  // "mine=true" scopes these to the logged-in employee where the API supports it.
  const { data: balanceData } = useLeaveBalances({ mine: true });
  const { data: payslipData } = usePayslips({ mine: true, page_size: 5 });
  const balances = normalizeList(balanceData).results;
  const payslips = normalizeList(payslipData).results;

  const totalLeaveDays = balances.reduce(
    (sum, b) => sum + (Number((b as { balance?: number }).balance ?? 0) || 0),
    0,
  );

  const actions: QuickAction[] = [
    { label: "Apply for Leave", description: "Request time off", to: "/hrm/leave/requests", icon: CalendarPlus, permission: "add_leaverequest" },
    { label: "My Leave", description: "Requests & balances", to: "/hrm/leave/balances", icon: CalendarClock },
    { label: "My Payslips", description: "Download payslips", to: "/payroll/payslips", icon: Receipt, permission: "view_payslip" },
    { label: "P9 Tax Card", description: "Annual tax card", to: "/reports/p9", icon: FileText, permission: "view_payslip" },
    { label: "Timesheets", description: "Log & submit hours", to: "/hrm/attendance/timesheets", icon: ClipboardList },
    { label: "Attendance", description: "My attendance records", to: "/hrm/attendance/records", icon: ClipboardList, permission: "view_attendancerecord" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title={`Hi, ${name}`} subtitle="Your self-service home" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Leave Balance (days)" value={totalLeaveDays || "—"} icon={CalendarClock} accent="text-green-600" />
        <StatTile label="Recent Payslips" value={payslips.length || "—"} icon={Wallet} accent="text-primary" />
        <StatTile label="Leave Types" value={balances.length || "—"} icon={CalendarPlus} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Quick actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => {
            const card = (
              <Link key={a.label} href={`/${orgSlug}${a.to}`}>
                <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:bg-accent/5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <a.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </Card>
              </Link>
            );
            return a.permission ? (
              <PermissionGate key={a.label} permission={a.permission}>
                {card}
              </PermissionGate>
            ) : (
              card
            );
          })}
        </div>
      </div>
    </div>
  );
}
