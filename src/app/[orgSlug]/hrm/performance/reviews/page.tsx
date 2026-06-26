"use client";

import { ClipboardCheck, Plus, Send } from "lucide-react";
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
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useApproveReview,
  usePerformanceReviews,
  useRejectReview,
  useSavePerformanceReview,
  useSubmitReview,
} from "@/hooks/use-performance";
import { normalizeList } from "@/lib/api/drf";
import { type PerformanceReview } from "@/lib/api/performance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const empty = { employee: "", period: "", review_date: "", rating: "", comments: "" };

export default function PerformanceReviewsPage() {
  const { options: employees } = useEmployeeOptions();
  const [tab, setTab] = useState<"all" | "approvals">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoring, setScoring] = useState<PerformanceReview | null>(null);
  const [form, setForm] = useState(empty);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, status: tab === "approvals" ? "submitted" : undefined }),
    [page, tab],
  );
  const { data, isLoading, error, refetch } = usePerformanceReviews(params);
  const save = useSavePerformanceReview();
  const submit = useSubmitReview();
  const approve = useApproveReview();
  const reject = useRejectReview();
  const { results, count } = normalizeList<PerformanceReview>(data);

  const isDraft = (r: PerformanceReview) => ["draft", ""].includes((r.status || "").toLowerCase());
  const isPending = (r: PerformanceReview) =>
    ["submitted", "pending", "in_review"].includes((r.status || "").toLowerCase());

  const columns: Column<PerformanceReview>[] = [
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name || r.employee || "—"}</span> },
    { header: "Reviewer", cell: (r) => r.reviewer_name || "—" },
    { header: "Period", cell: (r) => r.period || "—" },
    { header: "Date", cell: (r) => formatDate(r.review_date) },
    { header: "Rating", cell: (r) => r.rating ?? r.overall_rating ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Score review" title="Score metrics" onClick={() => setScoring(r)}>
            <ClipboardCheck className="size-4" />
          </Button>
          {isDraft(r) && (
            <PermissionGate permission="change_performancereview">
              <Button variant="ghost" size="icon" aria-label="Submit" onClick={() => submit.mutate(r.id)}>
                <Send className="size-4 text-primary" />
              </Button>
            </PermissionGate>
          )}
          <ApprovalActions
            size="sm"
            pending={isPending(r)}
            permission={["approve_performancereview", "change_performancereview"]}
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
    if (!form.employee) return;
    save.mutate(
      {
        data: {
          // employee id is a UUID string — do not Number() it.
          employee: form.employee,
          // erp-api review create takes title/description; reuse period/comments.
          title: form.period || undefined,
          description: form.comments || undefined,
          period: form.period || undefined,
          review_date: form.review_date || undefined,
          rating: form.rating ? Number(form.rating) : undefined,
          comments: form.comments || undefined,
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
            <Button size="sm" onClick={submitForm} disabled={save.isPending}>
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
          <Field label="Period" htmlFor="pr-period">
            <Input id="pr-period" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. Q2 2026" />
          </Field>
          <Field label="Review Date" htmlFor="pr-date">
            <Input id="pr-date" type="date" value={form.review_date} onChange={(e) => setForm((f) => ({ ...f, review_date: e.target.value }))} />
          </Field>
          <Field label="Rating (1-5)" htmlFor="pr-rating">
            <Input id="pr-rating" type="number" step="0.5" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} />
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
