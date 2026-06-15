"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge, Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/form";
import { usePermissions, useRole, useSetRolePermissions } from "@/hooks/use-rbac";
import { groupPermissions, type ErpRole } from "@/lib/api/rbac";

const WILDCARD_ROLE = "erp_admin"; // all-access role — permissions not editable

/** Role→permission matrix editor. Disabled (read-only) for the all-access role. */
export function PermissionMatrixDialog({ role, onClose }: { role: ErpRole | null; onClose: () => void }) {
  const { data: permsData } = usePermissions();
  const { data: full } = useRole(role?.id ?? null);
  const setPerms = useSetRolePermissions();

  const grouped = useMemo(() => groupPermissions(permsData?.permissions ?? []), [permsData]);
  const locked = role?.role_code === WILDCARD_ROLE;

  const [checked, setChecked] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (full?.permission_codes) setChecked(new Set(full.permission_codes));
  }, [full]);

  if (!role) return null;
  const busy = setPerms.isPending;

  const toggle = (code: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const save = () =>
    setPerms.mutate({ id: role.id, codes: [...checked] }, { onSuccess: onClose });

  return (
    <Dialog
      open={!!role}
      onClose={onClose}
      title={`Permissions — ${role.name}`}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Close
          </Button>
          {!locked && (
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save permissions"}
            </Button>
          )}
        </>
      }
    >
      {locked ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
          <Badge variant="outline">All access</Badge>
          <p className="text-xs text-muted-foreground">
            The administrator role always has every permission and is not editable.
          </p>
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-4 overflow-auto pr-1">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {module}
              </h4>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {perms.map((p) => (
                  <label
                    key={p.permission_code}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <code className="block truncate text-[11px] text-muted-foreground">
                        {p.permission_code}
                      </code>
                    </span>
                    <Switch
                      id={p.permission_code}
                      checked={checked.has(p.permission_code)}
                      onChange={() => toggle(p.permission_code)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
