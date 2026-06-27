"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useDeleteJobPosting,
  useJobPostings,
  useSaveJobPosting,
} from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import { type JobPosting } from "@/lib/api/recruitment";
import { formatDate } from "@/lib/utils";

import { JobFormDialog } from "./_job-form-dialog";

function salaryLabel(j: JobPosting): string {
  const min = j.salary_min ? Number(j.salary_min) : null;
  const max = j.salary_max ? Number(j.salary_max) : null;
  if (min == null && max == null) return "—";
  const cur = j.salary_currency || "";
  const fmt = (n: number) => n.toLocaleString();
  if (min != null && max != null) return `${cur} ${fmt(min)} – ${fmt(max)}`.trim();
  return `${cur} ${fmt((min ?? max) as number)}`.trim();
}

export default function JobsPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";
  const { data, isLoading, error, refetch } = useJobPostings();
  const save = useSaveJobPosting();
  const del = useDeleteJobPosting();
  const rows = normalizeList<JobPosting>(data).results;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [toDelete, setToDelete] = useState<JobPosting | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (job: JobPosting) => {
    setEditing(job);
    setDialogOpen(true);
  };

  const handleSave = (payload: Partial<JobPosting>) =>
    save.mutate(
      { id: editing?.id, data: payload },
      { onSuccess: () => setDialogOpen(false) },
    );

  const columns: Column<JobPosting>[] = [
    { header: "Title", cell: (j) => <span className="font-medium">{j.title || "—"}</span> },
    { header: "Department", cell: (j) => j.department_name || "—" },
    { header: "Location", cell: (j) => j.location || "—" },
    { header: "Type", cell: (j) => <span className="capitalize">{j.employment_type || "—"}</span> },
    { header: "Salary", cell: (j) => <span className="whitespace-nowrap text-xs">{salaryLabel(j)}</span> },
    { header: "Openings", cell: (j) => j.num_positions ?? j.openings ?? "—" },
    { header: "Closing", cell: (j) => formatDate(j.application_deadline ?? j.closing_date) },
    { header: "Status", cell: (j) => <StatusBadge status={j.status} /> },
    {
      header: "Public",
      cell: (j) =>
        j.is_public ? <Badge variant="success">Live</Badge> : <Badge variant="secondary">Private</Badge>,
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (j) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_jobposting">
            <IconButton label="Edit posting" onClick={() => openEdit(j)}>
              <Pencil className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="delete_jobposting">
            <IconButton label="Delete posting" onClick={() => setToDelete(j)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Job Postings"
        subtitle="Open requisitions and postings"
        actions={
          <PermissionGate permission="add_jobposting">
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" /> New Posting
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(j) => j.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No job postings yet"
          emptyDescription="No job postings yet. Create one to start recruiting."
        />
      </Card>

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

      <JobFormDialog
        open={dialogOpen}
        job={editing}
        orgSlug={orgSlug}
        saving={save.isPending}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete job posting?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
