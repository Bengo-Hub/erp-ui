"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { TransferList, type TransferItem } from "@/components/ui/transfer-list";
import { useRoles, useUserActions } from "@/hooks/use-users";
import { normalizeList } from "@/lib/api/drf";
import { type ManagedUser, type Role } from "@/lib/api/users";

/** Resolve the role ids currently assigned to a user. */
function userRoleIds(user: ManagedUser): Set<number> {
  const ids = new Set<number>();
  (user.roles ?? []).forEach((r) => {
    if (typeof r === "object" && r && "id" in r) ids.add(r.id);
  });
  (user.role_ids ?? []).forEach((id) => ids.add(id));
  return ids;
}

/** Assign/remove roles for a user via the TransferList. */
export function UserRolesDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  const { data } = useRoles({ page_size: 200 });
  const { assignRole, removeRole } = useUserActions();
  const roles = normalizeList<Role>(data).results;

  const items: TransferItem[] = useMemo(
    () => roles.map((r) => ({ value: String(r.id), label: r.name })),
    [roles],
  );
  const selected = useMemo(
    () => (user ? Array.from(userRoleIds(user)).map(String) : []),
    [user],
  );

  if (!user) return null;
  const busy = assignRole.isPending || removeRole.isPending;

  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      title={`Manage roles — ${user.full_name || user.username || user.email}`}
      maxWidth="max-w-2xl"
      footer={
        <Button size="sm" onClick={onClose} disabled={busy}>
          Done
        </Button>
      }
    >
      <TransferList
        items={items}
        selected={selected}
        disabled={busy}
        leftTitle="Available roles"
        rightTitle="Assigned roles"
        onMove={(value, assign) => {
          const args = { userId: user.id, roleId: Number(value) };
          if (assign) assignRole.mutate(args);
          else removeRole.mutate(args);
        }}
      />
    </Dialog>
  );
}
