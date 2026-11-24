"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useCreateTrainingEvaluation,
  useDeleteTrainingEvaluation,
  useTrainingEnrollments,
  useTrainingEvaluations,
  useUpdateTrainingEvaluation,
} from "@/hooks/use-training";
import { normalizeList } from "@/lib/api/drf";
import { type TrainingEnrollment, type TrainingEvaluation } from "@/lib/api/training";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.training.manage";
const empty = { enrollment: "", rating: "", feedback: "" };

export default function TrainingEvaluationsPage() {
  const { data, isLoading, error, refetch } = useTrainingEvaluations();
  const { data: enrolData, isLoading: enrolLoading } = useTrainingEnrollments({ page_size: 500 });
  const create = useCreateTrainingEvaluation();
  const update = useUpdateTrainingEvaluation();
  const del = useDeleteTrainingEvaluation();
  const rows = normalizeList<TrainingEvaluation>(data).results;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingEvaluation | null>(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<TrainingEvaluation | null>(null);
  const saving = create.isPending || update.isPending;

  // Only live enrolments can be evaluated (the API refuses cancelled ones).
  const enrolments = useMemo(
    () => normalizeList<TrainingEnrollment>(enrolData).results.filter((e) => e.status !== "cancelled"),
    [enrolData],
  );
  const enrolmentOptions = enrolments.map((e) => ({
    value: e.id,
    label: `${e.employee_name || "Employee"} · ${e.course_name || "Course"}`,
  }));
  const picked = enrolments.find((e) => e.id === form.enrollment);

  const openEdit = (e: TrainingEvaluation) => {
    setEditing(e);
    setForm({ enrollment: "", rating: e.rating ? String(e.rating) : "", feedback: e.feedback ?? "" });
    setOpen(true);
  };

  const columns: Column<TrainingEvaluation>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium">{e.employee_name || "—"}</span> },
    { header: "Course", cell: (e) => e.course_name || "—" },
    { header: "Rating", cell: (e) => (e.rating ? `${e.rating} / 5` : "—") },
    { header: "Feedback", cell: (e) => e.feedback || "—" },
    { header: "Date", cell: (e) => formatDate(e.created_at) },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <PermissionGate permission={MANAGE}>
          <div className="flex justify-end gap-1">
            <IconButton label="Edit evaluation" onClick={() => openEdit(e)}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="Delete evaluation" onClick={() => setToDelete(e)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(empty);
  };

  const submit = () => {
    if (!form.rating) return;
    const feedback = form.feedback.trim() || undefined;
    if (editing) {
      update.mutate({ id: editing.id, data: { rating: Number(form.rating), feedback } }, { onSuccess: close });
      return;
    }
    if (!picked?.course_id || !picked.employee_id) return;
    create.mutate(
      { course_id: picked.course_id, employee_id: picked.employee_id, rating: Number(form.rating), feedback },
      { onSuccess: close },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Training Evaluations"
        subtitle="Post-training feedback and ratings"
        actions={
          <PermissionGate permission={MANAGE}>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> New Evaluation
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
          emptyTitle="No evaluations"
          emptyDescription="Record how an enrolled employee rated a course once it ends."
        />
      </Card>

      <Dialog
        open={open}
        onClose={close}
        title={editing ? "Edit Training Evaluation" : "New Training Evaluation"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving || (!editing && !picked) || !form.rating}>
              {saving ? "Saving…" : "Save evaluation"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {editing ? (
            <p className="text-sm text-muted-foreground">
              {editing.employee_name || "Employee"} · {editing.course_name || "Course"}
            </p>
          ) : (
            <Field
              label="Enrolment"
              htmlFor="ev-enrolment"
              required
              help={enrolments.length === 0 && !enrolLoading ? "Nobody is enrolled on a course yet. Enrol employees first." : "The employee and the course they attended."}
            >
              <Combobox
                value={form.enrollment}
                onChange={(v) => setForm((f) => ({ ...f, enrollment: v }))}
                options={enrolmentOptions}
                loading={enrolLoading}
                placeholder="Choose employee and course…"
                searchPlaceholder="Search by employee or course…"
                emptyText="No matching enrolment"
              />
            </Field>
          )}
          <Field label="Rating" htmlFor="ev-rating" required>
            <Select id="ev-rating" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}>
              <option value="">Choose a rating…</option>
              <option value="5">5, excellent</option>
              <option value="4">4, good</option>
              <option value="3">3, fair</option>
              <option value="2">2, poor</option>
              <option value="1">1, very poor</option>
            </Select>
          </Field>
          <Field label="Feedback" htmlFor="ev-feedback">
            <Textarea
              id="ev-feedback"
              value={form.feedback}
              onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))}
              placeholder="What worked, what to improve"
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete evaluation?"
        description="The rating and feedback are removed. This cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
