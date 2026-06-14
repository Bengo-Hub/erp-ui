"use client";

import { useParams, useRouter } from "next/navigation";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { StatusBadge } from "@/components/hrm/status-badge";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { EMPLOYMENT_TYPES } from "@/lib/hrm";
import {
  useDeleteJobPosting,
  useJobPostings,
  useSaveJobPosting,
} from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import { type JobPosting } from "@/lib/api/recruitment";
import { formatDate } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "title", label: "Job Title", required: true, span2: true },
  { name: "location", label: "Location" },
  {
    name: "employment_type",
    label: "Employment Type",
    type: "select",
    options: EMPLOYMENT_TYPES,
  },
  { name: "openings", label: "Openings", type: "number" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { name: "closing_date", label: "Closing Date", type: "date" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function JobsPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";
  const { data, isLoading, error, refetch } = useJobPostings();
  const save = useSaveJobPosting();
  const del = useDeleteJobPosting();
  const rows = normalizeList<JobPosting>(data).results;

  const columns: Column<JobPosting>[] = [
    { header: "Title", cell: (j) => <span className="font-medium">{j.title || "—"}</span> },
    { header: "Location", cell: (j) => j.location || "—" },
    { header: "Type", cell: (j) => <span className="capitalize">{j.employment_type || "—"}</span> },
    { header: "Openings", cell: (j) => j.openings ?? "—" },
    { header: "Closing", cell: (j) => formatDate(j.closing_date) },
    { header: "Status", cell: (j) => <StatusBadge status={j.status} /> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Job Postings"
        subtitle="Open requisitions and postings"
      />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Job Posting"
        perms={{ add: "add_jobposting", change: "change_jobposting", delete: "delete_jobposting" }}
        emptyDescription="No job postings yet. Create one to start recruiting."
        toForm={(j) => ({
          title: j?.title ?? "",
          location: j?.location ?? "",
          employment_type: j?.employment_type ?? "",
          openings: j?.openings ?? 1,
          status: j?.status ?? "draft",
          closing_date: j?.closing_date ?? "",
          description: j?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            { id, data: { ...data, openings: data.openings ? Number(data.openings) : undefined } as Partial<JobPosting> },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />

      <p className="text-center text-xs text-muted-foreground">
        Track applicants in the{" "}
        <button
          className="text-primary hover:underline"
          onClick={() => router.push(`/${orgSlug}/hrm/recruitment/applications`)}
        >
          applications pipeline
        </button>
        .
      </p>
    </div>
  );
}
