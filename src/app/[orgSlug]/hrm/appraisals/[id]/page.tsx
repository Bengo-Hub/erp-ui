"use client";

import { ArrowLeft, ClipboardEdit, RotateCcw, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent } from "@/components/ui/base";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import {
  useApproveAppraisal,
  useAppraisal,
  useAppraisalResponses,
  useRejectAppraisal,
  useReopenAppraisal,
  useSubmitAppraisal,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { type AppraisalResponse } from "@/lib/api/appraisals";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export default function AppraisalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? "";
  const id = params?.id as string;

  const { data: appraisal, isLoading, error, refetch } = useAppraisal(id);
  const { data: respData } = useAppraisalResponses(id);
  const responses = normalizeList<AppraisalResponse>(respData).results;

  const submit = useSubmitAppraisal();
  const approve = useApproveAppraisal();
  const reject = useRejectAppraisal();
  const reopen = useReopenAppraisal();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (error || !appraisal) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;

  const status = (appraisal.status || "").toLowerCase();
  const isDraft = ["draft", ""].includes(status);
  const isSubmitted = ["submitted", "pending", "in_review", "review"].includes(status);
  const isClosed = ["approved", "finalized", "completed", "rejected"].includes(status);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={`Appraisal: ${appraisal.employee_name || `#${appraisal.id}`}`}
        subtitle={appraisal.cycle_name ? `Cycle: ${appraisal.cycle_name}` : undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1.5 size-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Employee" value={appraisal.employee_name} />
            <Detail label="Reviewer" value={appraisal.reviewer_name} />
            <Detail label="Template" value={appraisal.template_name} />
            <Detail label="Cycle" value={appraisal.cycle_name} />
            <Detail label="Overall Score" value={appraisal.overall_score} />
            <Detail label="Status" value={<StatusBadge status={appraisal.status} />} />
          </div>
          {appraisal.rejection_reason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span className="font-semibold">Rejection reason:</span> {appraisal.rejection_reason}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <PermissionGate permission="change_appraisal">
              <Button size="sm" variant="outline" onClick={() => router.push(`/${orgSlug}/hrm/appraisals/${id}/review`)}>
                <ClipboardEdit className="mr-1.5 size-4" /> Evaluate
              </Button>
            </PermissionGate>
            {isDraft && (
              <PermissionGate permission="change_appraisal">
                <Button size="sm" onClick={() => submit.mutate(appraisal.id)} disabled={submit.isPending}>
                  <Send className="mr-1.5 size-4" /> Submit
                </Button>
              </PermissionGate>
            )}
            <ApprovalActions
              pending={isSubmitted}
              permission={["approve_appraisal", "change_appraisal"]}
              approveLabel="Finalize"
              onApprove={() => approve.mutate(appraisal.id)}
              onReject={(reason) => reject.mutate({ id: appraisal.id, reason })}
              approving={approve.isPending}
              rejecting={reject.isPending}
            />
            {isClosed && (
              <PermissionGate permission="change_appraisal">
                <Button size="sm" variant="outline" onClick={() => reopen.mutate(appraisal.id)} disabled={reopen.isPending}>
                  <RotateCcw className="mr-1.5 size-4" /> Reopen
                </Button>
              </PermissionGate>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-bold text-foreground">Responses</h3>
        </div>
        <CardContent>
          {responses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No responses recorded yet. Use Evaluate to complete the form.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {responses.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.question_text || `Question #${r.question}`}</p>
                    {r.comment && <p className="mt-0.5 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{r.score ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
