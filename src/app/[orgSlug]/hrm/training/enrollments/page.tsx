"use client";

import { Ban, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useCancelEnrollment,
  useCompleteEnrollment,
  useDeleteTrainingEnrollment,
  useSaveTrainingEnrollment,
  useTrainingCourses,
  useTrainingEnrollments,
} from "@/hooks/use-training";
import { normalizeList } from "@/lib/api/drf";
import { type TrainingCourse, type TrainingEnrollment } from "@/lib/api/training";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.training.manage";
const emptyForm = { employee: "", course: "" };

export default function TrainingEnrollmentsPage() {
  const { options: employees } = useEmployeeOptions();
  const { data: courseData } = useTrainingCourses({ page_size: 200 });
  const courses = normalizeList<TrainingCourse>(courseData).results;

  const { data, isLoading, error, refetch } = useTrainingEnrollments();
  const save = useSaveTrainingEnrollment();
  const del = useDeleteTrainingEnrollment();
  const complete = useCompleteEnrollment();
  const cancel = useCancelEnrollment();
  const rows = normalizeList<TrainingEnrollment>(data).results;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingEnrollment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toCancel, setToCancel] = useState<TrainingEnrollment | null>(null);
  const [toDelete, setToDelete] = useState<TrainingEnrollment | null>(null);

  const active = (e: TrainingEnrollment) =>
    !["completed", "cancelled", "canceled"].includes((e.status || "").toLowerCase());

  const open = (e?: TrainingEnrollment) => {
    setEditing(e ?? null);
    setForm(e ? { employee: e.employee_id ?? "", course: e.course_id ?? "" } : emptyForm);
    setDialogOpen(true);
  };

  const close = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const columns: Column<TrainingEnrollment>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium">{e.employee_name || "—"}</span> },
    { header: "Course", cell: (e) => e.course_name || "—" },
    { header: "Enrolled", cell: (e) => formatDate(e.enrolled_at) },
    { header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <PermissionGate permission={MANAGE}>
          <div className="flex justify-end gap-1">
            {active(e) && (
              <>
                <IconButton label="Complete enrollment" onClick={() => complete.mutate(e.id)}>
                  <CheckCircle2 className="size-4 text-green-600" />
                </IconButton>
                <IconButton label="Cancel enrollment" onClick={() => setToCancel(e)}>
                  <Ban className="size-4 text-yellow-600" />
                </IconButton>
              </>
            )}
            <IconButton label="Edit enrollment" onClick={() => open(e)}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="Delete enrollment" onClick={() => setToDelete(e)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const submitForm = () => {
    if (!form.employee || !form.course) return;
    save.mutate(
      { id: editing?.id, data: { employee_id: form.employee, course_id: form.course } },
      { onSuccess: close },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Training Enrollments"
        subtitle="Enrolled employees and completion status"
        actions={
          <PermissionGate permission={MANAGE}>
            <Button size="sm" onClick={() => open()}>
              <Plus className="mr-1.5 size-4" /> Enroll Employee
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No enrollments"
          emptyDescription="Enroll employees into training courses to track progress."
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={close}
        title={editing ? "Edit Enrollment" : "Enroll Employee"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitForm} disabled={save.isPending || !form.employee || !form.course}>
              {save.isPending ? "Saving…" : editing ? "Save" : "Enroll"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {editing && (
            <p className="text-sm text-muted-foreground">
              An enrollment that already has an evaluation cannot be moved; delete the evaluation first.
            </p>
          )}
          <Field label="Employee" htmlFor="en-emp" required>
            <Select id="en-emp" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
              <option value="">Select employee…</option>
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Course" htmlFor="en-course" required>
            <Select id="en-course" value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}>
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toCancel}
        title="Cancel enrollment?"
        description="The employee will be removed from this course."
        destructive
        confirmLabel="Cancel Enrollment"
        loading={cancel.isPending}
        onCancel={() => setToCancel(null)}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id, { onSuccess: () => setToCancel(null) })}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete enrollment?"
        description="The enrollment record is removed. An enrollment with an evaluation cannot be deleted. This cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
