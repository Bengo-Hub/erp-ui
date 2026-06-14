"use client";

import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/form";
import { useSaveUser } from "@/hooks/use-users";
import { type ManagedUser } from "@/lib/api/users";

interface UserFormDialogProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
}

/** Create / edit a user. Password only collected on create. */
export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const save = useSaveUser();

  // Render-time seed keyed on the current open session (avoids effect cascade).
  const openKey = open ? `${user?.id ?? "new"}` : "";
  const [state, setState] = useState<{ key: string; values: Record<string, string | boolean> }>({
    key: "",
    values: {},
  });
  if (open && state.key !== openKey) {
    setState({
      key: openKey,
      values: {
        username: user?.username ?? "",
        email: user?.email ?? "",
        first_name: user?.first_name ?? "",
        last_name: user?.last_name ?? "",
        phone: (user?.phone as string) ?? "",
        is_staff: user?.is_staff ?? false,
        password: "",
      },
    });
  }
  const values = state.values;

  const set = (k: string, v: string | boolean) =>
    setState((s) => ({ ...s, values: { ...s.values, [k]: v } }));

  const submit = () => {
    const payload: Record<string, unknown> = {
      username: values.username,
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      is_staff: values.is_staff,
    };
    if (!user && values.password) payload.password = values.password;
    save.mutate({ id: user?.id, data: payload }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={user ? "Edit user" : "Add user"}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" htmlFor="u-username" required>
          <Input id="u-username" value={String(values.username ?? "")} onChange={(e) => set("username", e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="u-email" required>
          <Input id="u-email" type="email" value={String(values.email ?? "")} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="First name" htmlFor="u-first">
          <Input id="u-first" value={String(values.first_name ?? "")} onChange={(e) => set("first_name", e.target.value)} />
        </Field>
        <Field label="Last name" htmlFor="u-last">
          <Input id="u-last" value={String(values.last_name ?? "")} onChange={(e) => set("last_name", e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="u-phone">
          <Input id="u-phone" value={String(values.phone ?? "")} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        {!user && (
          <Field label="Temporary password" htmlFor="u-pass" help="Sent to the user; they reset on first login.">
            <Input id="u-pass" type="password" value={String(values.password ?? "")} onChange={(e) => set("password", e.target.value)} />
          </Field>
        )}
        <Field label="Staff access" htmlFor="u-staff" className="sm:col-span-2">
          <Switch id="u-staff" checked={!!values.is_staff} onChange={(c) => set("is_staff", c)} />
        </Field>
      </div>
    </Dialog>
  );
}
