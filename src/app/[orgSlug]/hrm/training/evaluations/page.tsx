"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteTrainingEvaluation,
  useSaveTrainingEvaluation,
  useTrainingEvaluations,
} from "@/hooks/use-training";
import { normalizeList } from "@/lib/api/drf";
import { type TrainingEvaluation } from "@/lib/api/training";
import { formatDate } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "enrollment", label: "Enrollment ID", type: "number", required: true },
  { name: "rating", label: "Rating (1-5)", type: "number", step: "0.5" },
  { name: "feedback", label: "Feedback", type: "textarea", span2: true },
];

export default function TrainingEvaluationsPage() {
  const { data, isLoading, error, refetch } = useTrainingEvaluations();
  const save = useSaveTrainingEvaluation();
  const del = useDeleteTrainingEvaluation();
  const rows = normalizeList<TrainingEvaluation>(data).results;

  const columns: Column<TrainingEvaluation>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium">{e.employee_name || "—"}</span> },
    { header: "Course", cell: (e) => e.course_name || "—" },
    { header: "Rating", cell: (e) => (e.rating != null ? `${e.rating} / 5` : "—") },
    { header: "Feedback", cell: (e) => e.feedback || "—" },
    { header: "Date", cell: (e) => formatDate(e.created_at) },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Training Evaluations" subtitle="Post-training feedback and ratings" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Evaluation"
        perms={{ add: "add_trainingevaluation", change: "change_trainingevaluation", delete: "delete_trainingevaluation" }}
        emptyDescription="No training evaluations recorded yet."
        toForm={(e) => ({
          enrollment: e?.enrollment ?? "",
          rating: e?.rating ?? "",
          feedback: e?.feedback ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            { id, data: { ...data, enrollment: data.enrollment ? Number(data.enrollment) : undefined } as Partial<TrainingEvaluation> },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
