"use client";

import { useState } from "react";

import { Badge, Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { useRoles, useSaveUser } from "@/hooks/use-users";
import { type ManagedUser } from "@/lib/api/users";

interface UserFormDialogProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
}

/**
 * Invite (create) or edit a tenant member via auth-api.
 *  - Invite: email + name + phone + roles. auth-api creates the SSO account if
 *    new and returns a one-time temp password (surfaced via the save toast).
 *  - Edit: name/phone are profile-only on auth-api and not editable through the
 *    member endpoint, so editing focuses on the role set.
 */
export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const save = useSaveUser();
  const { data: roleOptions = [] } = useRoles();

  const openKey = open ? `${user?.id ?? "new"}` : "";
  const [state, setState] = useState<{
    key: string;
    email: string;
    name: string;
    phone: string;
    roles: string[];
  }>({ key: "", email: "", name: "", phone: "", roles: [] });

  if (open && state.key !== openKey) {
    setState({
      key: openKey,
      email: user?.email ?? "",
      name: user?.name ?? user?.full_name ?? "",
      phone: (user?.phone as string) ?? "",
      roles: user?.roles ?? [],
    });
  }

  const toggleRole = (role: string) =>
    setState((s) => ({
      ...s,
      roles: s.roles.includes(role) ? s.roles.filter((r) => r !== role) : [...s.roles, role],
    }));

  const submit = () => {
    if (user) {
      // Edit existing member → role set only (keyed by user_id).
      save.mutate({ data: { user_id: user.user_id, roles: state.roles } }, { onSuccess: onClose });
    } else {
      save.mutate(
        { data: { email: state.email, name: state.name, phone: state.phone, roles: state.roles } },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={user ? "Edit user roles" : "Add user"}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={save.isPending || (!user && !state.email)}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {!user && (
          <>
            <Field label="Email" htmlFor="u-email" required>
              <Input
                id="u-email"
                type="email"
                value={state.email}
                onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              />
            </Field>
            <Field label="Full name" htmlFor="u-name">
              <Input
                id="u-name"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              />
            </Field>
            <Field label="Phone" htmlFor="u-phone">
              <Input
                id="u-phone"
                value={state.phone}
                onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
              />
            </Field>
          </>
        )}
        <Field label="Roles" htmlFor="u-roles" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2" id="u-roles">
            {roleOptions.map((r) => {
              const on = state.roles.includes(r.id);
              return (
                <button key={r.id} type="button" onClick={() => toggleRole(r.id)} aria-pressed={on}>
                  <Badge variant={on ? "success" : "outline"} className="cursor-pointer">
                    {r.name}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Field>
      </div>
      {!user && (
        <p className="mt-3 text-xs text-muted-foreground">
          New accounts receive a one-time temporary password (shown after saving) and an SSO
          login link by email.
        </p>
      )}
    </Dialog>
  );
}
