"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useDeleteDisciplinary, useEmployeeDisciplinary, useSaveDisciplinary } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmployeeDisciplinary } from "@/lib/api/employees";

type FormValues = Omit<EmployeeDisciplinary, "id" | "employee_id">;

export function DisciplinaryTab({ employeeId }: { employeeId: number | string }) {
  const { data, isLoading, error, refetch } = useEmployeeDisciplinary(employeeId);
  const save = useSaveDisciplinary(employeeId);
  const del = useDeleteDisciplinary(employeeId);
  const rows = normalizeList<EmployeeDisciplinary>(data).results;

  const [editing, setEditing] = useState<EmployeeDisciplinary | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EmployeeDisciplinary | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const openCreate = () => {
    setEditing(null);
    reset({ incident_date: "", category: "", action_taken: "", status: "open", description: "", document_url: "" });
    setDialogOpen(true);
  };
  const openEdit = (d: EmployeeDisciplinary) => {
    setEditing(d);
    reset({
      incident_date: d.incident_date?.slice(0, 10), category: d.category, action_taken: d.action_taken,
      status: d.status || "open", description: d.description, document_url: d.document_url,
    });
    setDialogOpen(true);
  };
  const onSubmit = (v: FormValues) =>
    save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setDialogOpen(false) });

  const columns: Column<EmployeeDisciplinary>[] = [
    { header: "Date", cell: (d) => d.incident_date?.slice(0, 10) || "—" },
    { header: "Category", cell: (d) => <span className="font-medium">{d.category || "—"}</span> },
    { header: "Action", cell: (d) => d.action_taken || "—" },
    {
      header: "Status",
      cell: (d) => (
        <Badge variant={d.status === "resolved" || d.status === "closed" ? "success" : "secondary"}>
          {d.status || "open"}
        </Badge>
      ),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (d) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <Button variant="ghost" size="icon" onClick={() => openEdit(d)} aria-label="Edit record" title="Edit record">
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <Button variant="ghost" size="icon" onClick={() => setToDelete(d)} aria-label="Delete record" title="Delete record">
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
        <h3 className="text-sm font-bold text-foreground">Disciplinary</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Add Record
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No disciplinary records"
        emptyDescription="No disciplinary actions recorded for this employee."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Disciplinary Record" : "Add Disciplinary Record"}
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
          <Field label="Incident date"><Input type="date" {...register("incident_date")} /></Field>
          <Field label="Category" help="e.g. misconduct, attendance"><Input {...register("category")} /></Field>
          <Field label="Action taken"><Input {...register("action_taken")} /></Field>
          <Field label="Status">
            <Select {...register("status")}>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2"><Textarea {...register("description")} /></Field>
          <Field label="Document URL" className="sm:col-span-2"><Input {...register("document_url")} /></Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete disciplinary record?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </Card>
  );
}
