"use client";

import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";

import { UsersTabs } from "../_tabs";

/**
 * Permissions are not a managed catalogue in auth-api (SSO). Effective
 * permissions are derived from a user's roles and surfaced in the access-token
 * `permissions` claim — there is no per-permission CRUD endpoint to wire to.
 * This screen documents that ownership rather than fabricating an API.
 */
export default function PermissionsPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Users & Security" subtitle="How permissions are granted" />
      <UsersTabs active="permissions" />

      <Card className="flex items-start gap-3 p-6">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">Permissions are role-derived</p>
          <p className="text-muted-foreground">
            Single sign-on (auth-service) does not expose an editable permission catalogue.
            A user&apos;s effective permissions come from the roles assigned to their membership
            and are embedded in the access token. To change what a user can do, adjust their
            roles from the <span className="font-medium text-foreground">Users</span> tab.
          </p>
        </div>
      </Card>
    </div>
  );
}
