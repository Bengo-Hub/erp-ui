"use client";

import { Badge, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useRoles } from "@/hooks/use-users";
import { type Role } from "@/lib/api/users";

import { UsersTabs } from "../_tabs";

/**
 * Roles reference. auth-api (SSO) has no role table — roles are free-form strings
 * assigned per tenant membership, drawn from this canonical set. Assign them to a
 * user from the Users tab (Manage roles). There is therefore no create/edit/delete
 * here; the list is informational.
 */
export default function RolesPage() {
  const { data: roles = [], isLoading, error, refetch } = useRoles();

  const columns: Column<Role>[] = [
    { header: "Role", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Key", cell: (r) => <code className="text-xs">{r.id}</code> },
    { header: "Description", cell: (r) => r.description || "—" },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Users & Security"
        subtitle="Canonical tenant roles assignable to members"
      />
      <UsersTabs active="roles" />

      <Card className="border-dashed bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Managed by SSO</Badge>
          <p className="text-xs text-muted-foreground">
            Roles are assigned per user from the Users tab. They are plain strings on the SSO
            membership, not editable records.
          </p>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={roles}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No roles"
          emptyDescription="No roles are defined."
        />
      </Card>
    </div>
  );
}
