"use client";

import { Ban, CheckCircle2, Plus } from "lucide-react";
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
  useSaveTrainingEnrollment,
  useTrainingCourses,
  useTrainingEnrollments,
} from "@/hooks/use-training";
import { normalizeList } from "@/lib/api/drf";
import { type TrainingCourse, type TrainingEnrollment } from "@/lib/api/training";
import { formatDate } from "@/lib/utils";

export default function TrainingEnrollmentsPage() {
  const { options: employees } = useEmployeeOptions();
  const { data: courseData } = useTrainingCourses({ page_size: 200 });
  const courses = normalizeList<TrainingCourse>(courseData).results;

  const { data, isLoading, error, refetch } = useTrainingEnrollments();
  const save = useSaveTrainingEnrollment();
  const complete = useCompleteEnrollment();
  const cancel = useCancelEnrollment();
  const rows = normalizeList<TrainingEnrollment>(data).results;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee: "", course: "" });
  const [toCancel, setToCancel] = useState<TrainingEnrollment | null>(null);

  const active = (e: TrainingEnrollment) =>
    !["completed", "cancelled", "canceled"].includes((e.status || "").toLowerCase());

  const columns: Column<TrainingEnrollment>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium">{e.employee_name || e.employee || "—"}</span> },
    { header: "Course", cell: (e) => e.course_name || e.course || "—" },
    { header: "Enrolled", cell: (e) => formatDate(e.enrolled_at) },
    { header: "Score", cell: (e) => e.score ?? "—" },
    { header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) =>
        active(e) ? (
          <PermissionGate permission="change_trainingenrollment">
            <div className="flex justify-end gap-1">
              <IconButton label="Complete enrollment" onClick={() => complete.mutate(e.id)}>
                <CheckCircle2 className="size-4 text-green-600" />
              </IconButton>
              <IconButton label="Cancel enrollment" onClick={() => setToCancel(e)}>
                <Ban className="size-4 text-destructive" />
              </IconButton>
            </div>
          </PermissionGate>
        ) : null,
    },
  ];

  const submitForm = () => {
    if (!form.employee || !form.course) return;
    save.mutate(
      { data: { employee: form.employee, course: form.course } },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ employee: "", course: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Training Enrollments"
        subtitle="Enrolled employees and completion status"
        actions={
          <PermissionGate permission="add_trainingenrollment">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
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
        onClose={() => setDialogOpen(false)}
        title="Enroll Employee"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitForm} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Enroll"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
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
                  {c.name || c.title}
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
    </div>
  );
}
