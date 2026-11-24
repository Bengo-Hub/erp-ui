"use client";

import { ClipboardCheck, Play, Plus, RotateCcw, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { ReviewScoreDialog } from "./_score-dialog";
import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useApproveReview,
  usePerformanceReviews,
  useRejectReview,
  useReopenReview,
  useSavePerformanceReview,
  useStartReview,
  useSubmitReview,
} from "@/hooks/use-performance";
import { normalizeList } from "@/lib/api/drf";
import { REVIEW_STATUS_LABELS, type PerformanceReview } from "@/lib/api/performance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const empty = { employee: "", period: "", review_date: "", reviewer: "", comments: "" };
const MANAGE = "hrm.performance.manage";

export default function PerformanceReviewsPage() {
  const { options: employees } = useEmployeeOptions();
  const [tab, setTab] = useState<"all" | "approvals">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoring, setScoring] = useState<PerformanceReview | null>(null);
  const [form, setForm] = useState(empty);

  const params = useMemo(
    // The approvals queue is the reviews submitted for approval (erp-api state "completed").
    () => ({ page, page_size: PAGE_SIZE, status: tab === "approvals" ? "completed" : undefined }),
    [page, tab],
  );
  const { data, isLoading, error, refetch } = usePerformanceReviews(params);
  const save = useSavePerformanceReview();
  const start = useStartReview();
  const submit = useSubmitReview();
  const approve = useApproveReview();
  const reject = useRejectReview();
  const reopen = useReopenReview();
  const { results, count } = normalizeList<PerformanceReview>(data);

  const columns: Column<PerformanceReview>[] = [
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name || "—"}</span> },
    { header: "Reviewer", cell: (r) => r.reviewer_name || "—" },
    { header: "Review", cell: (r) => r.title || "—" },
    { header: "Date", cell: (r) => formatDate(r.review_date) },
    { header: "Rating", cell: (r) => (r.overall_rating != null ? `${Number(r.overall_rating)} / 5` : "—") },
    {
      header: "Status",
      cell: (r) => (
        <span title={r.status === "rejected" && r.comments ? `Reason: ${r.comments}` : undefined}>
          <StatusBadge status={r.status} labels={REVIEW_STATUS_LABELS} />
        </span>
      ),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label="Score review" onClick={() => setScoring(r)}>
            <ClipboardCheck className="size-4" />
          </IconButton>
          <PermissionGate permission={MANAGE}>
            {r.status === "draft" && (
              <IconButton label="Start review" onClick={() => start.mutate(r.id)} disabled={start.isPending}>
                <Play className="size-4 text-primary" />
              </IconButton>
            )}
            {r.status === "in_progress" && (
              <IconButton label="Submit for approval" onClick={() => submit.mutate(r.id)} disabled={submit.isPending}>
                <Send className="size-4 text-primary" />
              </IconButton>
            )}
            {r.status === "rejected" && (
              <IconButton label="Reopen review" onClick={() => reopen.mutate(r.id)} disabled={reopen.isPending}>
                <RotateCcw className="size-4 text-primary" />
              </IconButton>
            )}
          </PermissionGate>
          <ApprovalActions
            size="sm"
            pending={r.status === "completed"}
            permission={MANAGE}
            onApprove={() => approve.mutate(r.id)}
            onReject={(reason) => reject.mutate({ id: r.id, reason })}
            approving={approve.isPending}
            rejecting={reject.isPending}
          />
        </div>
      ),
    },
  ];

  const submitForm = () => {
    if (!form.employee || !form.period.trim()) return;
    save.mutate(
      {
        data: {
          // ids are UUID strings, never Number() them. erp-api review create takes
          // employee_id, title, description, review_date and reviewer_id.
          employee: form.employee,
          title: form.period.trim(),
          description: form.comments || undefined,
          review_date: form.review_date || undefined,
          reviewer: form.reviewer || undefined,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm(empty);
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Performance Reviews"
        subtitle="Periodic performance reviews and approvals"
        actions={
          <PermissionGate permission="add_performancereview">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 size-4" /> New Review
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-border px-4 pt-2">
          <Tabs
            tabs={[
              { key: "all", label: "All Reviews" },
              { key: "approvals", label: "Approvals Queue" },
            ]}
            active={tab}
            onChange={(k) => {
              setTab(k as "all" | "approvals");
              setPage(1);
            }}
          />
        </div>
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={tab === "approvals" ? "Nothing to approve" : "No reviews"}
          emptyDescription={
            tab === "approvals"
              ? "There are no submitted reviews awaiting approval."
              : "Create a performance review to get started."
          }
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
        title="New Performance Review"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitForm} disabled={save.isPending || !form.employee || !form.period.trim()}>
              {save.isPending ? "Saving…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="pr-emp" required className="sm:col-span-2">
            <Select id="pr-emp" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
              <option value="">Select employee…</option>
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Review title" htmlFor="pr-period" required>
            <Input id="pr-period" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. Q2 2026 review" />
          </Field>
          <Field label="Review Date" htmlFor="pr-date">
            <Input id="pr-date" type="date" value={form.review_date} onChange={(e) => setForm((f) => ({ ...f, review_date: e.target.value }))} />
          </Field>
          <Field label="Reviewer" htmlFor="pr-reviewer" className="sm:col-span-2">
            <Select id="pr-reviewer" value={form.reviewer} onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))}>
              <option value="">No reviewer yet</option>
              {employees
                .filter((o) => o.value !== form.employee)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Comments" htmlFor="pr-comments" className="sm:col-span-2">
            <Textarea id="pr-comments" value={form.comments} onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))} />
          </Field>
        </div>
      </Dialog>

      {scoring && <ReviewScoreDialog review={scoring} onClose={() => setScoring(null)} />}
    </div>
  );
}
