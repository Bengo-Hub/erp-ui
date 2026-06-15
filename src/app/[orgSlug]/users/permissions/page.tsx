"use client";

import { useMemo } from "react";

import { Badge, Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-rbac";
import { groupPermissions } from "@/lib/api/rbac";

import { UsersTabs } from "../_tabs";

/**
 * The erp service permission catalogue (read-only), owned by this service. Roles
 * are composed from these on the Roles tab. The catalogue itself is defined in
 * code + seeded, so it is presented read-only here, grouped by module.
 */
export default function PermissionsPage() {
  const { data, isLoading } = usePermissions();
  const grouped = useMemo(() => groupPermissions(data?.permissions ?? []), [data]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Users & Security" subtitle="Service permission catalogue" />
      <UsersTabs active="permissions" />

      <Card className="border-dashed bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          These are the fine-grained permissions this service enforces. Compose them into roles
          on the <span className="font-medium text-foreground">Roles</span> tab, then assign roles
          to members from the <span className="font-medium text-foreground">Users</span> tab.
        </p>
      </Card>

      {isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Loading permissions…</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Object.entries(grouped).map(([module, perms]) => (
            <Card key={module} className="p-4">
              <h3 className="mb-2 text-sm font-semibold capitalize">{module}</h3>
              <div className="space-y-1.5">
                {perms.map((p) => (
                  <div key={p.permission_code} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <code className="block truncate text-[11px] text-muted-foreground">
                        {p.permission_code}
                      </code>
                    </span>
                    <Badge variant="outline" className="shrink-0 capitalize">{p.action}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
