"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { TransferList, type TransferItem } from "@/components/ui/transfer-list";
import { useRoles, useUserActions } from "@/hooks/use-users";
import { type ManagedUser } from "@/lib/api/users";

/**
 * Manage a member's role set. auth-api stores roles as plain strings on the
 * tenant membership, so the TransferList edits a string array and commits the
 * whole set via the member update endpoint (PUT .../members/{user_id}).
 */
export function UserRolesDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  const { data: roleOptions = [] } = useRoles();
  const { setRoles } = useUserActions();

  const items: TransferItem[] = useMemo(
    () => roleOptions.map((r) => ({ value: r.id, label: r.name })),
    [roleOptions],
  );

  const openKey = user ? String(user.id) : "";
  const [draft, setDraft] = useState<{ key: string; roles: string[] }>({ key: "", roles: [] });
  if (user && draft.key !== openKey) {
    setDraft({ key: openKey, roles: user.roles ?? [] });
  }

  if (!user) return null;
  const busy = setRoles.isPending;

  const commit = (next: string[]) => {
    setDraft((d) => ({ ...d, roles: next }));
    if (user.user_id) setRoles.mutate({ userId: user.user_id, roles: next });
  };

  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      title={`Manage roles — ${user.name || user.full_name || user.email}`}
      maxWidth="max-w-2xl"
      footer={
        <Button size="sm" onClick={onClose} disabled={busy}>
          Done
        </Button>
      }
    >
      <TransferList
        items={items}
        selected={draft.roles}
        disabled={busy}
        leftTitle="Available roles"
        rightTitle="Assigned roles"
        onMove={(value, assign) => {
          const next = assign
            ? [...draft.roles, value]
            : draft.roles.filter((r) => r !== value);
          commit(next);
        }}
      />
    </Dialog>
  );
}
