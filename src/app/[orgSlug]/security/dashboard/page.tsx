"use client";

import { Lock, ShieldAlert, ShieldCheck, UserCheck, Users } from "lucide-react";

import { Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { useSecurityDashboard } from "@/hooks/use-security";
import { type SecurityEvent } from "@/lib/api/security";

import { UsersTabs } from "../../users/_tabs";
import { SecuritySettingsCards } from "./_settings-cards";

export default function SecurityDashboardPage() {
  const { data, isLoading, error, refetch } = useSecurityDashboard();

  const eventColumns: Column<SecurityEvent>[] = [
    { header: "Event", cell: (e) => <span className="font-medium">{e.event_type || "—"}</span> },
    { header: "User", cell: (e) => e.user || "—" },
    { header: "IP", cell: (e) => <code className="text-xs">{e.ip_address || "—"}</code> },
    { header: "When", cell: (e) => (e.timestamp ? new Date(e.timestamp).toLocaleString() : "—") },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Security" subtitle="Account security posture & recent activity" />
      <UsersTabs active="security" />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Total Users" value={data?.total_users ?? "—"} icon={Users} />
            <StatTile label="Active Users" value={data?.active_users ?? "—"} icon={UserCheck} accent="text-green-600" />
            <StatTile label="Locked Accounts" value={data?.locked_accounts ?? "—"} icon={Lock} accent="text-yellow-600" />
            <StatTile label="Failed Logins (24h)" value={data?.failed_logins_24h ?? "—"} icon={ShieldAlert} accent="text-red-600" />
            <StatTile label="2FA Enabled" value={data?.two_factor_enabled ?? "—"} icon={ShieldCheck} accent="text-primary" />
          </div>

          <SecuritySettingsCards />

          <Card>
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-bold text-foreground">Recent security events</h3>
            </div>
            <DataTable
              columns={eventColumns}
              rows={data?.recent_events ?? []}
              rowKey={(_e) => (data?.recent_events ?? []).indexOf(_e)}
              emptyTitle="No recent events"
              emptyDescription="Security events will appear here as they occur."
            />
          </Card>
        </>
      )}
    </div>
  );
}
