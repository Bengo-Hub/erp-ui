"use client";

import { ArrowLeft, ClipboardEdit, Eye, RotateCcw, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import {
  useApproveAppraisal,
  useAppraisal,
  useAppraisalQuestions,
  useAppraisalResponses,
  useRejectAppraisal,
  useReopenAppraisal,
  useSubmitAppraisal,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import {
  APPRAISAL_STATUS_LABELS,
  type AppraisalQuestion,
  type AppraisalResponse,
} from "@/lib/api/appraisals";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

const MANAGE = "hrm.appraisal.manage";

export default function AppraisalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? "";
  const id = params?.id as string;

  const { data: appraisal, isLoading, error, refetch } = useAppraisal(id);
  const { data: respData } = useAppraisalResponses(id);
  const { data: qData } = useAppraisalQuestions(appraisal?.template_id ?? undefined);
  const responses = normalizeList<AppraisalResponse>(respData).results;
  const questionText = useMemo(() => {
    const m = new Map<string, string>();
    for (const q of normalizeList<AppraisalQuestion>(qData).results) m.set(String(q.id), q.question_text || q.text || "");
    return m;
  }, [qData]);

  const submit = useSubmitAppraisal();
  const approve = useApproveAppraisal();
  const reject = useRejectAppraisal();
  const reopen = useReopenAppraisal();
  const [confirm, setConfirm] = useState<"submit" | "reopen" | null>(null);

  if (isLoading) return <div className="p-6"><DetailSkeleton /></div>;
  if (error || !appraisal) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;

  const status = appraisal.status ?? "draft";
  const rated = responses.map((r) => Number(r.rating)).filter((n) => Number.isFinite(n) && n > 0);
  const average = rated.length ? (rated.reduce((s, n) => s + n, 0) / rated.length).toFixed(1) : undefined;
  const evaluate = () => router.push(`/${orgSlug}/hrm/appraisals/${id}/review`);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={`Appraisal: ${appraisal.employee_name || "employee"}`}
        subtitle={appraisal.cycle_name ? `Cycle: ${appraisal.cycle_name}` : undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/${orgSlug}/hrm/appraisals`)}>
            <ArrowLeft className="mr-1.5 size-4" /> All appraisals
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Employee" value={appraisal.employee_name} />
            <Detail label="Reviewer" value={appraisal.evaluator_name} />
            <Detail label="Template" value={appraisal.template_name} />
            <Detail label="Cycle" value={appraisal.cycle_name} />
            <Detail
              label="Overall rating"
              value={appraisal.overall_rating != null ? `${Number(appraisal.overall_rating)} / 5` : undefined}
            />
            <Detail label="Status" value={<StatusBadge status={status} labels={APPRAISAL_STATUS_LABELS} />} />
          </div>
          {appraisal.rejection_reason && status === "rejected" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span className="font-semibold">Rejection reason:</span> {appraisal.rejection_reason}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {(status === "draft" || status === "in_progress") && (
              <PermissionGate permission={MANAGE}>
                <Button size="sm" variant={status === "draft" ? "primary" : "outline"} onClick={evaluate}>
                  <ClipboardEdit className="mr-1.5 size-4" />
                  {status === "draft" ? "Start evaluation" : "Continue evaluation"}
                </Button>
              </PermissionGate>
            )}
            {status === "in_progress" && (
              <PermissionGate permission={MANAGE}>
                <Button size="sm" onClick={() => setConfirm("submit")} disabled={submit.isPending}>
                  <Send className="mr-1.5 size-4" /> Submit for review
                </Button>
              </PermissionGate>
            )}
            <ApprovalActions
              pending={status === "completed"}
              permission={MANAGE}
              onApprove={() => approve.mutate(appraisal.id)}
              onReject={(reason) => reject.mutate({ id: appraisal.id, reason })}
              approving={approve.isPending}
              rejecting={reject.isPending}
            />
            {status === "rejected" && (
              <PermissionGate permission={MANAGE}>
                <Button size="sm" variant="outline" onClick={() => setConfirm("reopen")} disabled={reopen.isPending}>
                  <RotateCcw className="mr-1.5 size-4" /> Reopen for changes
                </Button>
              </PermissionGate>
            )}
            {(status === "completed" || status === "approved" || status === "rejected") && (
              <Button size="sm" variant="outline" onClick={evaluate}>
                <Eye className="mr-1.5 size-4" /> View evaluation form
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-bold text-foreground">Answers</h3>
        </div>
        <CardContent>
          {responses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No answers recorded yet. Use Start evaluation to complete the form.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {responses.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {questionText.get(String(r.question_id)) || "Question"}
                    </p>
                    {r.response && <p className="mt-0.5 text-sm text-muted-foreground">{r.response}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {r.rating != null ? `${Number(r.rating)} / 5` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm === "submit"}
        title="Submit this appraisal for review?"
        description={`It goes to the approver with an overall rating of ${average ? `${average} / 5` : "none"}, the average of the rated answers. The answers can only change again if the approver rejects it.`}
        confirmLabel="Submit for review"
        loading={submit.isPending}
        onConfirm={() => submit.mutate({ id: appraisal.id, overallRating: average }, { onSettled: () => setConfirm(null) })}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "reopen"}
        title="Reopen this appraisal?"
        description="It goes back to in progress so the evaluator can change the answers and submit it again."
        confirmLabel="Reopen"
        loading={reopen.isPending}
        onConfirm={() => reopen.mutate(appraisal.id, { onSettled: () => setConfirm(null) })}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
