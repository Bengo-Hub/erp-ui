"use client";

import { KeyRound, Pencil, Plus, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
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
  return (
    u.full_name ||
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.username ||
    u.email ||
    `User #${u.id}`
  );
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
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined }),
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
          <span className="text-xs text-muted-foreground">{u.email || u.username || "—"}</span>
        </div>
      ),
    },
    {
      header: "Roles",
      cell: (u) => {
        const roles = (u.roles ?? []).map((r) => (typeof r === "object" ? r.name : r));
        return roles.length ? (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 3).map((r) => (
              <Badge key={String(r)} variant="outline">{String(r)}</Badge>
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
        <Badge variant={u.is_active === false ? "secondary" : "success"}>
          {u.is_active === false ? "Inactive" : "Active"}
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
            <Button variant="ghost" size="icon" aria-label="Manage roles" onClick={() => setRolesFor(u)}>
              <Shield className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="change_user">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset password"
              onClick={() => resetPassword.mutate(u.id)}
            >
              <KeyRound className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="change_user">
            {u.is_active === false ? (
              <Button variant="ghost" size="icon" aria-label="Activate" onClick={() => activate.mutate(u.id)}>
                <UserCheck className="size-4 text-green-600" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Deactivate" onClick={() => deactivate.mutate(u.id)}>
                <UserX className="size-4 text-yellow-600" />
              </Button>
            )}
          </PermissionGate>
          <PermissionGate permission="change_user">
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(u); setFormOpen(true); }}>
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_user">
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(u)}>
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
        subtitle="Manage users, roles and permissions"
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
        title="Delete user?"
        description={`This will permanently remove ${toDelete ? userName(toDelete) : "this user"}.`}
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
