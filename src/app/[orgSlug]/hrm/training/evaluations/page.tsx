"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  useCreateTrainingEvaluation,
  useTrainingEnrollments,
  useTrainingEvaluations,
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
  const rows = normalizeList<TrainingEvaluation>(data).results;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

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

  const columns: Column<TrainingEvaluation>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium">{e.employee_name || "—"}</span> },
    { header: "Course", cell: (e) => e.course_name || "—" },
    { header: "Rating", cell: (e) => (e.rating ? `${e.rating} / 5` : "—") },
    { header: "Feedback", cell: (e) => e.feedback || "—" },
    { header: "Date", cell: (e) => formatDate(e.created_at) },
  ];

  const close = () => {
    setOpen(false);
    setForm(empty);
  };

  const submit = () => {
    if (!picked?.course_id || !picked.employee_id || !form.rating) return;
    create.mutate(
      {
        course_id: picked.course_id,
        employee_id: picked.employee_id,
        rating: Number(form.rating),
        feedback: form.feedback.trim() || undefined,
      },
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
        title="New Training Evaluation"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close} disabled={create.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={create.isPending || !picked || !form.rating}>
              {create.isPending ? "Saving…" : "Save evaluation"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
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
    </div>
  );
}
