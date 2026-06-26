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
import { useDeleteEducation, useEmployeeEducation, useSaveEducation } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmployeeEducation } from "@/lib/api/employees";

type FormValues = Omit<EmployeeEducation, "id" | "employee_id">;

export function EducationTab({ employeeId }: { employeeId: number | string }) {
  const { data, isLoading, error, refetch } = useEmployeeEducation(employeeId);
  const save = useSaveEducation(employeeId);
  const del = useDeleteEducation(employeeId);
  const rows = normalizeList<EmployeeEducation>(data).results;

  const [editing, setEditing] = useState<EmployeeEducation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EmployeeEducation | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const openCreate = () => {
    setEditing(null);
    reset({ institution: "", qualification: "", field_of_study: "", grade: "", start_date: "", end_date: "", certificate_url: "" });
    setDialogOpen(true);
  };
  const openEdit = (e: EmployeeEducation) => {
    setEditing(e);
    reset({
      institution: e.institution, qualification: e.qualification, field_of_study: e.field_of_study,
      grade: e.grade, start_date: e.start_date?.slice(0, 10), end_date: e.end_date?.slice(0, 10),
      certificate_url: e.certificate_url,
    });
    setDialogOpen(true);
  };
  const onSubmit = (v: FormValues) =>
    save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setDialogOpen(false) });

  const columns: Column<EmployeeEducation>[] = [
    { header: "Institution", cell: (e) => <span className="font-medium">{e.institution || "—"}</span> },
    { header: "Qualification", cell: (e) => e.qualification || "—" },
    { header: "Field", cell: (e) => e.field_of_study || "—" },
    { header: "Grade", cell: (e) => e.grade || "—" },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <IconButton label="Edit education" onClick={() => openEdit(e)}>
              <Pencil className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <IconButton label="Delete education" onClick={() => setToDelete(e)}>
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
        <h3 className="text-sm font-bold text-foreground">Education</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Add Education
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
        emptyTitle="No education records"
        emptyDescription="Record this employee's qualifications."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Education" : "Add Education"}
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
          <Field label="Institution"><Input {...register("institution")} /></Field>
          <Field label="Qualification"><Input {...register("qualification")} /></Field>
          <Field label="Field of study"><Input {...register("field_of_study")} /></Field>
          <Field label="Grade"><Input {...register("grade")} /></Field>
          <Field label="Start date"><Input type="date" {...register("start_date")} /></Field>
          <Field label="End date"><Input type="date" {...register("end_date")} /></Field>
          <Field label="Certificate URL" className="sm:col-span-2"><Input {...register("certificate_url")} /></Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete education record?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </Card>
  );
}
