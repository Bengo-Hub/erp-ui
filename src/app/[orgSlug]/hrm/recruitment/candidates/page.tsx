"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { StatusBadge } from "@/components/hrm/status-badge";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useCandidates,
  useDeleteCandidate,
  useSaveCandidate,
} from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import { CANDIDATE_STATUSES, type Candidate } from "@/lib/api/recruitment";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Full Name", required: true },
  { name: "email", label: "Email", required: true },
  { name: "phone", label: "Phone" },
  { name: "source", label: "Source", placeholder: "e.g. Referral, LinkedIn" },
  { name: "status", label: "Status", type: "select", options: CANDIDATE_STATUSES },
];

const STATUS_LABELS = Object.fromEntries(CANDIDATE_STATUSES.map((s) => [s.value, s.label]));

function candidateName(c: Candidate) {
  return c.full_name || c.name || "—";
}

export default function CandidatesPage() {
  const { data, isLoading, error, refetch } = useCandidates();
  const save = useSaveCandidate();
  const del = useDeleteCandidate();
  const rows = normalizeList<Candidate>(data).results;

  const columns: Column<Candidate>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{candidateName(c)}</span> },
    { header: "Email", cell: (c) => c.email || "—" },
    { header: "Phone", cell: (c) => c.phone || "—" },
    { header: "Source", cell: (c) => c.source || "—" },
    { header: "Status", cell: (c) => <StatusBadge status={c.status} labels={STATUS_LABELS} /> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Candidates" subtitle="Talent pool and applicants" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Candidate"
        perms={{ add: "add_candidate", change: "change_candidate", delete: "delete_candidate" }}
        emptyDescription="No candidates in the pool yet."
        toForm={(c) => ({
          name: c ? candidateName(c) : "",
          email: c?.email ?? "",
          phone: c?.phone ?? "",
          source: c?.source ?? "",
          status: c?.status ?? "new",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<Candidate> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
