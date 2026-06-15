"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useCreateRole, useUpdateRole } from "@/hooks/use-rbac";
import { type ErpRole } from "@/lib/api/rbac";

/**
 * Create/Edit a service-level role. The same dialog handles both: when `role` is
 * set it edits (role_code is immutable then), otherwise it creates a new one.
 */
export function RoleFormDialog({
  open,
  role,
  onClose,
}: {
  open: boolean;
  role: ErpRole | null;
  onClose: () => void;
}) {
  const isEdit = !!role;
  const create = useCreateRole();
  const update = useUpdateRole();
  const [form, setForm] = useState({ role_code: "", name: "", description: "" });

  useEffect(() => {
    if (open) {
      setForm({
        role_code: role?.role_code ?? "",
        name: role?.name ?? "",
        description: role?.description ?? "",
      });
    }
  }, [open, role]);

  const busy = create.isPending || update.isPending;

  const submit = () => {
    if (isEdit && role) {
      update.mutate(
        { id: role.id, data: { name: form.name, description: form.description } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        { role_code: form.role_code.trim(), name: form.name.trim(), description: form.description },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit role — ${role?.name}` : "New role"}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={busy || !form.name.trim() || (!isEdit && !form.role_code.trim())}
          >
            {busy ? "Saving…" : isEdit ? "Save" : "Create role"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Role key" required={!isEdit} help={isEdit ? "Key cannot be changed." : "Lowercase, e.g. payroll_clerk"}>
          <Input
            value={form.role_code}
            disabled={isEdit}
            placeholder="payroll_clerk"
            onChange={(e) => setForm((f) => ({ ...f, role_code: e.target.value }))}
          />
        </Field>
        <Field label="Name" required>
          <Input
            value={form.name}
            placeholder="Payroll Clerk"
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            placeholder="What this role is for"
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
      </div>
    </Dialog>
  );
}
