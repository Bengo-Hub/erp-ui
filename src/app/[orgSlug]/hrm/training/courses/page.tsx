"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { StatusBadge } from "@/components/hrm/status-badge";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteTrainingCourse,
  useSaveTrainingCourse,
  useTrainingCourses,
} from "@/hooks/use-training";
import { normalizeList } from "@/lib/api/drf";
import { type TrainingCourse } from "@/lib/api/training";
import { formatDate, formatMoney } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Course Name", required: true, span2: true },
  { name: "provider", label: "Provider" },
  { name: "duration", label: "Duration (hrs)", type: "number" },
  { name: "cost", label: "Cost", type: "number", step: "0.01" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "scheduled", label: "Scheduled" },
      { value: "ongoing", label: "Ongoing" },
      { value: "completed", label: "Completed" },
    ],
  },
  { name: "start_date", label: "Start Date", type: "date" },
  { name: "end_date", label: "End Date", type: "date" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function TrainingCoursesPage() {
  const { data, isLoading, error, refetch } = useTrainingCourses();
  const save = useSaveTrainingCourse();
  const del = useDeleteTrainingCourse();
  const rows = normalizeList<TrainingCourse>(data).results;

  const columns: Column<TrainingCourse>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name || c.title || "—"}</span> },
    { header: "Provider", cell: (c) => c.provider || "—" },
    { header: "Duration", cell: (c) => (c.duration != null ? `${c.duration} hrs` : "—") },
    { header: "Cost", className: "text-right", headerClassName: "text-right", cell: (c) => formatMoney(c.cost) },
    { header: "Starts", cell: (c) => formatDate(c.start_date) },
    { header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Training Courses" subtitle="Learning programs and sessions" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Course"
        perms={{ add: "add_trainingcourse", change: "change_trainingcourse", delete: "delete_trainingcourse" }}
        emptyDescription="No training courses yet."
        toForm={(c) => ({
          name: c?.name ?? c?.title ?? "",
          provider: c?.provider ?? "",
          duration: c?.duration ?? "",
          cost: c?.cost ?? "",
          status: c?.status ?? "draft",
          start_date: c?.start_date ?? "",
          end_date: c?.end_date ?? "",
          description: c?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<TrainingCourse> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
