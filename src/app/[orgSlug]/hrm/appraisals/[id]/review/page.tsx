"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent } from "@/components/ui/base";
import { Field, Input, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import {
  useAppraisal,
  useAppraisalQuestions,
  useAppraisalResponses,
  useSaveResponses,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { type AppraisalQuestion, type AppraisalResponse } from "@/lib/api/appraisals";

interface Answer {
  score: string;
  comment: string;
}

export default function AppraisalReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: appraisal, isLoading, error, refetch } = useAppraisal(id);
  const templateId = appraisal?.template;
  const { data: qData, isLoading: qLoading } = useAppraisalQuestions(templateId);
  const { data: respData } = useAppraisalResponses(id);
  const save = useSaveResponses();

  const questions = useMemo(() => normalizeList<AppraisalQuestion>(qData).results, [qData]);
  const existing = useMemo(() => normalizeList<AppraisalResponse>(respData).results, [respData]);

  // Seed answers from existing responses once (render-time guard, keyed on the
  // response set's identity, avoids an effect/setState cascade).
  const [seededFor, setSeededFor] = useState<unknown>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  if (existing.length && seededFor !== existing) {
    const seed: Record<string, Answer> = {};
    for (const r of existing) {
      if (r.question != null) seed[String(r.question)] = { score: String(r.score ?? ""), comment: r.comment ?? "" };
    }
    setSeededFor(existing);
    setAnswers((prev) => ({ ...seed, ...prev }));
  }

  const setAnswer = (qid: number | string, patch: Partial<Answer>) =>
    setAnswers((a) => {
      const current: Answer = a[qid] ?? { score: "", comment: "" };
      return { ...a, [qid]: { ...current, ...patch } };
    });

  const submit = () => {
    const payload = {
      // appraisal id is a UUID string — do not Number() it.
      appraisal: id,
      responses: questions.map((q) => ({
        question: q.id,
        score: answers[String(q.id)]?.score ? Number(answers[String(q.id)].score) : undefined,
        comment: answers[String(q.id)]?.comment || undefined,
      })),
    };
    save.mutate(
      { appraisalId: id, data: payload },
      { onSuccess: () => router.push(`/${params?.orgSlug}/hrm/appraisals/${id}`) },
    );
  };

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (error || !appraisal) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Evaluation"
        subtitle={appraisal.employee_name ? `Evaluating ${appraisal.employee_name}` : undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1.5 size-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-5">
          {qLoading ? (
            <LoadingState />
          ) : questions.length === 0 ? (
            <EmptyState
              title="No questions"
              description="This appraisal's template has no questions configured. Add questions to the template first."
            />
          ) : (
            <>
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {idx + 1}. {q.text || q.question_text || `Question #${q.id}`}
                    {q.weight != null && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(weight {q.weight})</span>
                    )}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    <Field label={`Score${q.max_score ? ` / ${q.max_score}` : ""}`} htmlFor={`score-${q.id}`}>
                      <Input
                        id={`score-${q.id}`}
                        type="number"
                        step="0.5"
                        value={answers[String(q.id)]?.score ?? ""}
                        onChange={(e) => setAnswer(q.id, { score: e.target.value })}
                      />
                    </Field>
                    <Field label="Comment" htmlFor={`comment-${q.id}`}>
                      <Textarea
                        id={`comment-${q.id}`}
                        value={answers[String(q.id)]?.comment ?? ""}
                        onChange={(e) => setAnswer(q.id, { comment: e.target.value })}
                        placeholder="Optional comment…"
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm" onClick={() => router.back()} disabled={save.isPending}>
                  Cancel
                </Button>
                <PermissionGate permission="change_appraisal">
                  <Button size="sm" onClick={submit} disabled={save.isPending}>
                    {save.isPending ? "Saving…" : "Save Evaluation"}
                  </Button>
                </PermissionGate>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
