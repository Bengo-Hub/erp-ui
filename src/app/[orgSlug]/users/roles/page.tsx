"use client";

import { KeySquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useDeleteRole, useRoles, useSaveRole } from "@/hooks/use-users";
import { normalizeList } from "@/lib/api/drf";
import { type Role } from "@/lib/api/users";

import { UsersTabs } from "../_tabs";
import { RolePermissionsDialog } from "./_role-permissions-dialog";

export default function RolesPage() {
  const { data, isLoading, error, refetch } = useRoles({ page_size: 200 });
  const save = useSaveRole();
  const del = useDeleteRole();
  const roles = normalizeList<Role>(data).results;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permsFor, setPermsFor] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const open = (role?: Role) => {
    setEditing(role ?? null);
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setFormOpen(true);
  };

  const submit = () => {
    if (!name.trim()) return;
    save.mutate(
      { id: editing?.id, data: { name, description } },
      { onSuccess: () => setFormOpen(false) },
    );
  };

  const columns: Column<Role>[] = [
    { header: "Role", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Description", cell: (r) => r.description || "—" },
    {
      header: "Permissions",
      cell: (r) => <Badge variant="outline">{(r.permissions ?? []).length} granted</Badge>,
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_role">
            <Button variant="ghost" size="icon" aria-label="Permissions" onClick={() => setPermsFor(r)}>
              <KeySquare className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="change_role">
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => open(r)}>
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_role">
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(r)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Users & Security"
        subtitle="Roles bundle permissions for assignment to users"
        actions={
          <PermissionGate permission="add_role">
            <Button size="sm" onClick={() => open()}>
              <Plus className="mr-1.5 size-4" /> Add Role
            </Button>
          </PermissionGate>
        }
      />
      <UsersTabs active="roles" />

      <Card>
        <DataTable
          columns={columns}
          rows={roles}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No roles yet"
          emptyDescription="Create a role, then grant it permissions."
        />
      </Card>

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit role" : "Add role"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="role-name" required>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="role-desc">
            <Textarea id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </Dialog>

      <RolePermissionsDialog role={permsFor} onClose={() => setPermsFor(null)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete role?"
        description="Users assigned this role will lose its permissions."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
