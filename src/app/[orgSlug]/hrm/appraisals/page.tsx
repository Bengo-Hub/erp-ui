"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useAppraisalCycles,
  useAppraisalTemplates,
  useAppraisals,
  useSaveAppraisal,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import {
  type Appraisal,
  type AppraisalCycle,
  type AppraisalTemplate,
} from "@/lib/api/appraisals";
import { PAGE_SIZE } from "@/lib/hrm";

export default function AppraisalsPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee: "", cycle: "", template: "" });
  const debounced = useDebounce(search);

  const { options: employees } = useEmployeeOptions();
  const { data: cycleData } = useAppraisalCycles({ page_size: 200 });
  const { data: tplData } = useAppraisalTemplates({ page_size: 200 });
  const cycles = normalizeList<AppraisalCycle>(cycleData).results;
  const templates = normalizeList<AppraisalTemplate>(tplData).results;

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined }),
    [page, debounced],
  );
  const { data, isLoading, error, refetch } = useAppraisals(params);
  const save = useSaveAppraisal();
  const { results, count } = normalizeList<Appraisal>(data);

  const columns: Column<Appraisal>[] = [
    { header: "Employee", cell: (a) => <span className="font-medium">{a.employee_name || a.employee || "—"}</span> },
    { header: "Cycle", cell: (a) => a.cycle_name || "—" },
    { header: "Template", cell: (a) => a.template_name || "—" },
    { header: "Reviewer", cell: (a) => a.reviewer_name || "—" },
    { header: "Score", cell: (a) => a.overall_score ?? "—" },
    { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  ];

  const submitForm = () => {
    if (!form.employee) return;
    save.mutate(
      {
        data: {
          // ids are UUID strings — do not Number() them.
          employee: form.employee,
          cycle: form.cycle || undefined,
          template: form.template || undefined,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ employee: "", cycle: "", template: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Appraisals"
        subtitle="Employee performance appraisals"
        actions={
          <PermissionGate permission="add_appraisal">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 size-4" /> New Appraisal
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search employee…"
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(a) => a.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No appraisals"
          emptyDescription="Create an appraisal to begin the review process."
          onRowClick={(a) => router.push(`/${orgSlug}/hrm/appraisals/${a.id}`)}
        />
        {results.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="New Appraisal"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitForm} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Employee" htmlFor="ap-emp" required>
            <Select id="ap-emp" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
              <option value="">Select employee…</option>
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cycle" htmlFor="ap-cycle">
            <Select id="ap-cycle" value={form.cycle} onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value }))}>
              <option value="">Select cycle…</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Template" htmlFor="ap-tpl">
            <Select id="ap-tpl" value={form.template} onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}>
              <option value="">Select template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
