"use client";

import { KeyRound, Pencil, Plus, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useDeleteUser, useUserActions, useUsers } from "@/hooks/use-users";
import { normalizeList } from "@/lib/api/drf";
import { PAGE_SIZE } from "@/lib/hrm";
import { type ManagedUser } from "@/lib/api/users";

import { UserFormDialog } from "./_user-form-dialog";
import { UserRolesDialog } from "./_user-roles-dialog";
import { UsersTabs } from "./_tabs";

function userName(u: ManagedUser): string {
  return u.name || u.full_name || u.email || `User ${u.user_id ?? u.id}`;
}

function isInactive(u: ManagedUser): boolean {
  return u.status != null && u.status !== "active";
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [rolesFor, setRolesFor] = useState<ManagedUser | null>(null);
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: debounced || undefined }),
    [page, debounced],
  );
  const { data, isLoading, error, refetch } = useUsers(params);
  const { results: users, count } = normalizeList<ManagedUser>(data);
  const del = useDeleteUser();
  const { activate, deactivate, resetPassword } = useUserActions();

  const columns: Column<ManagedUser>[] = [
    {
      header: "User",
      cell: (u) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{userName(u)}</span>
          <span className="text-xs text-muted-foreground">{u.email || "—"}</span>
        </div>
      ),
    },
    {
      header: "Roles",
      cell: (u) => {
        const roles = u.roles ?? [];
        return roles.length ? (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 3).map((r) => (
              <Badge key={r} variant="outline">{r}</Badge>
            ))}
            {roles.length > 3 && <Badge variant="secondary">+{roles.length - 3}</Badge>}
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      header: "Status",
      cell: (u) => (
        <Badge variant={isInactive(u) ? "secondary" : "success"}>
          {isInactive(u) ? (u.status === "suspended" ? "Suspended" : "Inactive") : "Active"}
        </Badge>
      ),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_user">
            <IconButton label="Manage roles" onClick={() => setRolesFor(u)}>
              <Shield className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="change_user">
            <IconButton label="Reset password" onClick={() => u.user_id && resetPassword.mutate(u.user_id)}>
              <KeyRound className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="change_user">
            {isInactive(u) ? (
              <IconButton label="Activate user" onClick={() => u.user_id && activate.mutate(u.user_id)}>
                <UserCheck className="size-4 text-green-600" />
              </IconButton>
            ) : (
              <IconButton label="Deactivate user" onClick={() => u.user_id && deactivate.mutate(u.user_id)}>
                <UserX className="size-4 text-yellow-600" />
              </IconButton>
            )}
          </PermissionGate>
          <PermissionGate permission="change_user">
            <IconButton label="Edit user" onClick={() => { setEditing(u); setFormOpen(true); }}>
              <Pencil className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="delete_user">
            <IconButton label="Delete user" onClick={() => setToDelete(u)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Users & Security"
        subtitle="Manage tenant members and their roles"
        actions={
          <PermissionGate permission="add_user">
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="mr-1.5 size-4" /> Add User
            </Button>
          </PermissionGate>
        }
      />
      <UsersTabs active="users" />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search name, email…"
            className="min-w-[220px] flex-1"
          />
        </div>
        <DataTable
          columns={columns}
          rows={users}
          rowKey={(u) => u.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No users found"
          emptyDescription="Add a user or adjust your search."
        />
        {users.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <UserFormDialog open={formOpen} user={editing} onClose={() => setFormOpen(false)} />
      <UserRolesDialog user={rolesFor} onClose={() => setRolesFor(null)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Remove user?"
        description={`This will remove ${toDelete ? userName(toDelete) : "this user"} from this organization.`}
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          toDelete?.user_id && del.mutate(toDelete.user_id, { onSuccess: () => setToDelete(null) })
        }
      />
    </div>
  );
}
