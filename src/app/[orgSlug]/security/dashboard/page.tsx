"use client";

import { Info } from "lucide-react";

import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";

import { UsersTabs } from "../../users/_tabs";
import { SecuritySettingsCards } from "./_settings-cards";

/**
 * Security page. auth-api (SSO) owns account security but exposes only
 * self-service 2FA — there is no dashboard-stats / audit-log / security-settings
 * / password-policy API (reported as out of scope for auth-api). This page
 * therefore surfaces the self-service controls that DO exist.
 */
export default function SecurityDashboardPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Security" subtitle="Two-factor authentication for your account" />
      <UsersTabs active="security" />

      <Card className="flex items-start gap-3 border-dashed bg-muted/30 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Security posture metrics, audit logs and password policy are managed centrally by
          single sign-on and are not exposed here. You can manage your own two-factor
          authentication below.
        </p>
      </Card>

      <SecuritySettingsCards />
    </div>
  );
}
