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
import { IconButton } from "@/components/ui/tooltip";
import { useDeleteEmployment, useEmployeeEmployment, useSaveEmployment } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmploymentHistory } from "@/lib/api/employees";

type FormValues = Omit<EmploymentHistory, "id" | "employee_id">;

export function EmploymentTab({ employeeId }: { employeeId: number | string }) {
  const { data, isLoading, error, refetch } = useEmployeeEmployment(employeeId);
  const save = useSaveEmployment(employeeId);
  const del = useDeleteEmployment(employeeId);
  const rows = normalizeList<EmploymentHistory>(data).results;

  const [editing, setEditing] = useState<EmploymentHistory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EmploymentHistory | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const openCreate = () => {
    setEditing(null);
    reset({ employer: "", designation: "", start_date: "", end_date: "", reason_for_leaving: "" });
    setDialogOpen(true);
  };
  const openEdit = (e: EmploymentHistory) => {
    setEditing(e);
    reset({
      employer: e.employer, designation: e.designation,
      start_date: e.start_date?.slice(0, 10), end_date: e.end_date?.slice(0, 10),
      reason_for_leaving: e.reason_for_leaving,
    });
    setDialogOpen(true);
  };
  const onSubmit = (v: FormValues) =>
    save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setDialogOpen(false) });

  const columns: Column<EmploymentHistory>[] = [
    { header: "Employer", cell: (e) => <span className="font-medium">{e.employer || "—"}</span> },
    { header: "Designation", cell: (e) => e.designation || "—" },
    { header: "From", cell: (e) => e.start_date?.slice(0, 10) || "—" },
    { header: "To", cell: (e) => e.end_date?.slice(0, 10) || "—" },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <IconButton label="Edit employment" onClick={() => openEdit(e)}>
              <Pencil className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <IconButton label="Delete employment" onClick={() => setToDelete(e)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">Employment History</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Add Record
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No employment history"
        emptyDescription="Record this employee's prior employment."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Employment Record" : "Add Employment Record"}
        maxWidth="max-w-2xl"
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
          <Field label="Employer"><Input {...register("employer")} /></Field>
          <Field label="Designation"><Input {...register("designation")} /></Field>
          <Field label="Start date"><Input type="date" {...register("start_date")} /></Field>
          <Field label="End date"><Input type="date" {...register("end_date")} /></Field>
          <Field label="Reason for leaving" className="sm:col-span-2"><Input {...register("reason_for_leaving")} /></Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete employment record?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </Card>
  );
}
