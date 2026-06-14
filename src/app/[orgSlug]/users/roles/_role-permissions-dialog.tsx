"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { TransferList, type TransferItem } from "@/components/ui/transfer-list";
import { usePermissions, useRole, useRolePermissionActions } from "@/hooks/use-users";
import { normalizeList } from "@/lib/api/drf";
import { type Permission, type Role } from "@/lib/api/users";

function permModule(p: Permission): string {
  if (typeof p.module === "string") return p.module;
  if (p.content_type && typeof p.content_type === "object") return p.content_type.app_label ?? "";
  return "";
}

/** Assign/remove permissions for a role. Refetches role detail for live ids. */
export function RolePermissionsDialog({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const { data: permData } = usePermissions();
  const { data: detail } = useRole(role?.id);
  const { assign, remove } = useRolePermissionActions();
  const allPerms = normalizeList<Permission>(permData).results;

  const items: TransferItem[] = useMemo(
    () =>
      allPerms.map((p) => ({
        value: String(p.id),
        label: p.name || p.codename || `#${p.id}`,
        group: permModule(p),
      })),
    [allPerms],
  );

  const selected = useMemo(() => {
    const src = (detail ?? role)?.permissions ?? [];
    const ids = src.map((p) => (typeof p === "object" ? p.id : p));
    return ids.map(String);
  }, [detail, role]);

  if (!role) return null;
  const busy = assign.isPending || remove.isPending;

  return (
    <Dialog
      open={!!role}
      onClose={onClose}
      title={`Permissions — ${role.name}`}
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
        leftTitle="Available permissions"
        rightTitle="Granted permissions"
        onMove={(value, doAssign) => {
          const args = { roleId: role.id, permId: Number(value) };
          if (doAssign) assign.mutate(args);
          else remove.mutate(args);
        }}
      />
    </Dialog>
  );
}
