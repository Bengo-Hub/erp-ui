"use client";

import { ArrowLeft, Lock, Save, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import {
  type AppraisalAnswer,
  useAppraisal,
  useAppraisalQuestions,
  useAppraisalResponses,
  useSaveAppraisalAnswers,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import {
  APPRAISAL_STATUS_LABELS,
  type AppraisalQuestion,
  type AppraisalResponse,
} from "@/lib/api/appraisals";

interface Answer {
  rating: string;
  response: string;
}

const EMPTY: Answer = { rating: "", response: "" };
// The API stores ratings 0-5 with one decimal; half steps keep the picker short.
const RATING_OPTIONS = ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];
const EDITABLE = new Set(["draft", "in_progress"]);

/** A question takes a rating unless it is a free-text or yes/no question. */
const takesRating = (q: AppraisalQuestion) => !["text", "yes_no", "multiple_choice"].includes(q.question_type ?? "rating");

export default function AppraisalReviewPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? "";
  const id = params?.id as string;

  const { data: appraisal, isLoading, error, refetch } = useAppraisal(id);
  const templateId = appraisal?.template_id ?? undefined;
  const { data: qData, isLoading: qLoading, error: qError, refetch: qRefetch } = useAppraisalQuestions(templateId);
  const { data: respData } = useAppraisalResponses(id);
  const save = useSaveAppraisalAnswers();
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const questions = useMemo(() => normalizeList<AppraisalQuestion>(qData).results, [qData]);
  const existing = useMemo(() => normalizeList<AppraisalResponse>(respData).results, [respData]);

  // Seed answers from saved responses once per response set (render-time guard instead of
  // an effect, so typing is never overwritten by a refetch of the same data).
  const [seededFor, setSeededFor] = useState<unknown>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  if (existing.length && seededFor !== existing) {
    const seed: Record<string, Answer> = {};
    for (const r of existing) {
      if (r.question_id) seed[r.question_id] = { rating: r.rating != null ? String(Number(r.rating)) : "", response: r.response ?? "" };
    }
    setSeededFor(existing);
    setAnswers((prev) => ({ ...seed, ...prev }));
  }

  const setAnswer = (qid: string, patch: Partial<Answer>) =>
    setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] ?? EMPTY), ...patch } }));

  const ratings = questions
    .filter(takesRating)
    .map((q) => answers[String(q.id)]?.rating)
    .filter((r): r is string => !!r)
    .map(Number);
  const overall = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "";
  const missingRequired = questions.filter((q) => {
    if (q.is_required === false) return false;
    const a = answers[String(q.id)];
    return takesRating(q) ? !a?.rating : !a?.response?.trim();
  });

  const payload = (): AppraisalAnswer[] =>
    questions
      .filter((q) => answers[String(q.id)])
      .map((q) => ({
        question_id: String(q.id),
        response: answers[String(q.id)].response.trim(),
        rating: takesRating(q) ? answers[String(q.id)].rating || undefined : undefined,
      }));

  const backToAppraisal = () => router.push(`/${orgSlug}/hrm/appraisals/${id}`);
  const saveDraft = () => save.mutate({ appraisalId: id, answers: payload() });
  const submit = () =>
    save.mutate(
      { appraisalId: id, answers: payload(), submit: true, overallRating: overall || undefined },
      { onSuccess: backToAppraisal, onSettled: () => setConfirmSubmit(false) },
    );

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (error || !appraisal) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;

  const editable = EDITABLE.has(appraisal.status ?? "draft");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Evaluation"
        subtitle={[appraisal.employee_name, appraisal.cycle_name].filter(Boolean).join(" · ") || undefined}
        actions={
          <Button variant="outline" size="sm" onClick={backToAppraisal}>
            <ArrowLeft className="mr-1.5 size-4" /> Back to appraisal
          </Button>
        }
      />

      {!editable && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <span>
            This appraisal is <StatusBadge status={appraisal.status} labels={APPRAISAL_STATUS_LABELS} /> so its answers are
            read only. A rejected appraisal can be reopened from the appraisal page.
          </span>
        </div>
      )}

      <Card>
        <CardContent className="space-y-5">
          {!templateId ? (
            <EmptyState
              title="No template on this appraisal"
              description="This appraisal was created without a template, so there are no questions to answer."
            />
          ) : qLoading ? (
            <LoadingState label="Loading questions…" />
          ) : qError ? (
            <ErrorState error={qError} onRetry={qRefetch} />
          ) : questions.length === 0 ? (
            <EmptyState
              title="No questions"
              description="This appraisal's template has no questions yet. Add questions to the template first."
            />
          ) : (
            <>
              {questions.map((q, idx) => {
                const qid = String(q.id);
                const a = answers[qid] ?? EMPTY;
                const rated = takesRating(q);
                return (
                  <fieldset key={qid} disabled={!editable} className="space-y-3 rounded-lg border border-border p-4">
                    <legend className="px-1 text-sm font-semibold text-foreground">
                      {idx + 1}. {q.question_text || q.text}
                      {q.is_required !== false && <span className="ml-1 text-destructive" aria-label="required">*</span>}
                    </legend>
                    {q.category && <p className="text-xs text-muted-foreground">{q.category}</p>}
                    <div className={rated ? "grid gap-4 sm:grid-cols-[160px_1fr]" : "grid gap-4"}>
                      {rated && (
                        <Field label="Rating (1 to 5)" htmlFor={`rating-${qid}`}>
                          <Select id={`rating-${qid}`} value={a.rating} onChange={(e) => setAnswer(qid, { rating: e.target.value })}>
                            <option value="">Not rated</option>
                            {RATING_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}
                      {q.question_type === "yes_no" ? (
                        <Field label="Answer" htmlFor={`response-${qid}`}>
                          <Select id={`response-${qid}`} value={a.response} onChange={(e) => setAnswer(qid, { response: e.target.value })}>
                            <option value="">Choose…</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </Select>
                        </Field>
                      ) : (
                        <Field label={rated ? "Comment" : "Answer"} htmlFor={`response-${qid}`}>
                          <Textarea
                            id={`response-${qid}`}
                            value={a.response}
                            onChange={(e) => setAnswer(qid, { response: e.target.value })}
                            placeholder={rated ? "What supports this rating?" : "Your answer"}
                          />
                        </Field>
                      )}
                    </div>
                  </fieldset>
                );
              })}

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Overall rating: <span className="font-semibold text-foreground">{overall ? `${overall} / 5` : "not rated yet"}</span>
                  <span className="ml-1">(average of the rated questions)</span>
                </p>
                {editable && (
                  <PermissionGate permission="hrm.appraisal.manage">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={saveDraft} disabled={save.isPending}>
                        <Save className="mr-1.5 size-4" /> {save.isPending ? "Saving…" : "Save draft"}
                      </Button>
                      <Button size="sm" onClick={() => setConfirmSubmit(true)} disabled={save.isPending || missingRequired.length > 0}>
                        <Send className="mr-1.5 size-4" /> Submit for review
                      </Button>
                    </div>
                  </PermissionGate>
                )}
              </div>
              {editable && missingRequired.length > 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  Answer the {missingRequired.length} required question{missingRequired.length === 1 ? "" : "s"} marked * to submit.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit this evaluation for review?"
        description="The answers are saved and the appraisal goes to the approver. It can only be changed again if the approver rejects it."
        confirmLabel="Submit for review"
        loading={save.isPending}
        onConfirm={submit}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}
