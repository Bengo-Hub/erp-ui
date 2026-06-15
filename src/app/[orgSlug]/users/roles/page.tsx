"use client";

import { Lock, Pencil, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDeleteRole, useRoles } from "@/hooks/use-rbac";
import { type ErpRole } from "@/lib/api/rbac";

import { UsersTabs } from "../_tabs";
import { PermissionMatrixDialog } from "./_permission-matrix-dialog";
import { RoleFormDialog } from "./_role-form-dialog";

/**
 * Service-level roles — OWNED + managed by erp (Trinity Layer 3), not the SSO
 * read-only stub. Create/edit/delete custom roles and edit each role's permission
 * matrix. System roles are protected; the all-access role's perms are locked.
 * Global SSO role assignment to members still happens on the Users tab.
 */
export default function RolesPage() {
  const { data, isLoading, error, refetch } = useRoles();
  const del = useDeleteRole();
  const roles = data?.roles ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ErpRole | null>(null);
  const [matrixFor, setMatrixFor] = useState<ErpRole | null>(null);
  const [toDelete, setToDelete] = useState<ErpRole | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: ErpRole) => { setEditing(r); setFormOpen(true); };

  const columns: Column<ErpRole>[] = [
    {
      header: "Role",
      cell: (r) => (
        <span className="flex items-center gap-2 font-medium">
          {r.name}
          {r.is_system_role && <Badge variant="outline" className="gap-1"><Lock className="size-3" />System</Badge>}
        </span>
      ),
    },
    { header: "Key", cell: (r) => <code className="text-xs">{r.role_code}</code> },
    { header: "Description", cell: (r) => r.description || "—" },
    { header: "Permissions", cell: (r) => r.permission_count },
    { header: "Members", cell: (r) => r.member_count },
    {
      header: "",
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setMatrixFor(r)}>
            <Shield className="size-3.5" /> Permissions
          </Button>
          {!r.is_system_role && (
            <>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit role" title="Edit role">
                <Pencil className="size-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setToDelete(r)} aria-label="Delete role" title="Delete role">
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Users & Security"
        subtitle="Service-level roles & permissions"
        actions={<Button size="sm" onClick={openCreate}>New role</Button>}
      />
      <UsersTabs active="roles" />

      <Card className="border-dashed bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Service-managed</Badge>
          <p className="text-xs text-muted-foreground">
            These roles + permissions are owned by this service. Assign roles to members from the
            Users tab. System roles can&apos;t be deleted; the administrator role always has all access.
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
          emptyDescription="Create a role to get started."
        />
      </Card>

      <RoleFormDialog open={formOpen} role={editing} onClose={() => setFormOpen(false)} />
      <PermissionMatrixDialog role={matrixFor} onClose={() => setMatrixFor(null)} />
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete role "${toDelete?.name}"?`}
        description="Members assigned this role will lose its permissions. This cannot be undone."
        destructive
        loading={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
