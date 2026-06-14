"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import {
  useDeleteNextOfKin,
  useEmployeeNextOfKin,
  useSaveNextOfKin,
} from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmployeeNextOfKin } from "@/lib/api/employees";

type FormValues = Omit<EmployeeNextOfKin, "id" | "employee">;

export function KinTab({ employeeId }: { employeeId: number }) {
  const { data, isLoading, error, refetch } = useEmployeeNextOfKin(employeeId);
  const save = useSaveNextOfKin(employeeId);
  const del = useDeleteNextOfKin(employeeId);
  const kin = normalizeList<EmployeeNextOfKin>(data).results;

  const [editing, setEditing] = useState<EmployeeNextOfKin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EmployeeNextOfKin | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", relationship: "", phone_number: "", email: "", address: "" });
    setDialogOpen(true);
  };
  const openEdit = (k: EmployeeNextOfKin) => {
    setEditing(k);
    reset({
      name: k.name,
      relationship: k.relationship,
      phone_number: k.phone_number,
      email: k.email,
      address: k.address,
    });
    setDialogOpen(true);
  };

  const onSubmit = (v: FormValues) =>
    save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setDialogOpen(false) });

  const columns: Column<EmployeeNextOfKin>[] = [
    { header: "Name", cell: (k) => <span className="font-medium">{k.name || "—"}</span> },
    { header: "Relationship", cell: (k) => k.relationship || "—" },
    { header: "Phone", cell: (k) => k.phone_number || "—" },
    { header: "Email", cell: (k) => k.email || "—" },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (k) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <Button variant="ghost" size="icon" onClick={() => openEdit(k)} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <Button variant="ghost" size="icon" onClick={() => setToDelete(k)} aria-label="Delete">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">Next of Kin</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Add Kin
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={kin}
        rowKey={(k) => k.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No next of kin"
        emptyDescription="Record emergency contacts for this employee."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Next of Kin" : "Add Next of Kin"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input {...register("name")} />
          </Field>
          <Field label="Relationship">
            <Input {...register("relationship")} />
          </Field>
          <Field label="Phone">
            <Input {...register("phone_number")} />
          </Field>
          <Field label="Email">
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input {...register("address")} />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete next of kin?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </Card>
  );
}
