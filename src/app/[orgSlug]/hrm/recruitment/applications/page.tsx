"use client";

import { ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { useApplications, useTransitionApplication } from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import {
  APPLICATION_STAGES,
  nextStage,
  stageLabel,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/api/recruitment";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.recruitment.manage";

interface Move {
  app: JobApplication;
  to: ApplicationStage;
}

export default function ApplicationsPipelinePage() {
  const { data, isLoading, error, refetch } = useApplications({ page_size: 500 });
  const transition = useTransitionApplication();
  const apps = normalizeList<JobApplication>(data).results;

  const [move, setMove] = useState<Move | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [reason, setReason] = useState("");
  const [createEmployee, setCreateEmployee] = useState(true);

  const byStage = useMemo(() => {
    const groups: Record<string, JobApplication[]> = {};
    for (const s of APPLICATION_STAGES) groups[s.value] = [];
    for (const a of apps) (groups[a.status ?? "applied"] ?? groups.applied).push(a);
    return groups;
  }, [apps]);

  const openMove = (app: JobApplication, to: ApplicationStage) => {
    setInterviewDate("");
    setOfferDetails("");
    setReason("");
    setCreateEmployee(true);
    setMove({ app, to });
  };

  const confirmMove = () => {
    if (!move) return;
    transition.mutate(
      {
        id: move.app.id,
        input: {
          status: move.to,
          interview_date: move.to === "interview" && interviewDate ? interviewDate : undefined,
          offer_details: move.to === "offered" ? offerDetails.trim() || undefined : undefined,
          rejection_reason: move.to === "rejected" ? reason.trim() || undefined : undefined,
          create_employee: move.to === "hired" ? createEmployee : undefined,
        },
      },
      { onSuccess: () => setMove(null) },
    );
  };

  const candidate = (a: JobApplication) => a.candidate_name || a.candidate_email || "Unnamed candidate";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Applications Pipeline" subtitle="Move candidates through hiring stages" />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingState />
      ) : apps.length === 0 ? (
        <Card>
          <EmptyState
            title="No applications"
            description="Applications will appear here as candidates apply to job postings."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {APPLICATION_STAGES.map((stage) => (
            <div key={stage.value} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-foreground">{stage.label}</h3>
                <Badge variant="secondary">{byStage[stage.value]?.length ?? 0}</Badge>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-2">
                {(byStage[stage.value] ?? []).length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">None</p>
                ) : (
                  byStage[stage.value].map((a) => {
                    const next = nextStage(a.status);
                    return (
                      <Card key={a.id} className="border-border">
                        <div className="space-y-1.5 p-3">
                          <p className="text-sm font-medium text-foreground">{candidate(a)}</p>
                          {a.job_title && <p className="text-xs text-muted-foreground">{a.job_title}</p>}
                          {a.status === "interview" && a.interview_date && (
                            <p className="text-xs text-muted-foreground">Interview {formatDate(a.interview_date)}</p>
                          )}
                          {a.status === "rejected" && a.rejection_reason && (
                            <p className="text-xs text-muted-foreground">Reason: {a.rejection_reason}</p>
                          )}
                          {next && (
                            <PermissionGate permission={MANAGE}>
                              <div className="flex gap-1 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => openMove(a, next)}
                                  disabled={transition.isPending}
                                >
                                  {next === "hired" ? "Hire" : `Move to ${stageLabel(next)}`}
                                  <ChevronRight className="ml-1 size-3.5" />
                                </Button>
                                <IconButton
                                  label="Reject application"
                                  onClick={() => openMove(a, "rejected")}
                                  disabled={transition.isPending}
                                >
                                  <X className="size-4 text-destructive" />
                                </IconButton>
                              </div>
                            </PermissionGate>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!move}
        onClose={() => setMove(null)}
        title={
          move?.to === "rejected"
            ? `Reject ${move ? candidate(move.app) : ""}?`
            : move?.to === "hired"
              ? `Hire ${move ? candidate(move.app) : ""}?`
              : `Move ${move ? candidate(move.app) : ""} to ${stageLabel(move?.to)}`
        }
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setMove(null)} disabled={transition.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={move?.to === "rejected" ? "destructive" : "primary"}
              onClick={confirmMove}
              disabled={transition.isPending}
            >
              {transition.isPending
                ? "Saving…"
                : move?.to === "rejected"
                  ? "Reject application"
                  : move?.to === "hired"
                    ? "Hire"
                    : "Move"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {move?.app.job_title && (
            <p className="text-sm text-muted-foreground">Job: {move.app.job_title}</p>
          )}
          {move?.to === "interview" && (
            <Field label="Interview date" htmlFor="app-interview" help="Optional. Shown on the card.">
              <Input id="app-interview" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            </Field>
          )}
          {move?.to === "offered" && (
            <Field label="Offer terms" htmlFor="app-offer" help="Optional. Salary, start date and other terms offered.">
              <Textarea id="app-offer" value={offerDetails} onChange={(e) => setOfferDetails(e.target.value)} />
            </Field>
          )}
          {move?.to === "rejected" && (
            <>
              <p className="text-sm text-muted-foreground">
                A rejected application cannot be moved again. The candidate is told by email.
              </p>
              <Field label="Reason" htmlFor="app-reason" help="Optional. Kept on the application for your records.">
                <Textarea id="app-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            </>
          )}
          {move?.to === "hired" && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Create the employee record</p>
                <p className="text-xs text-muted-foreground">
                  Adds the candidate as an employee and starts their onboarding checklist. Complete their
                  details on the employee profile afterwards.
                </p>
              </div>
              <Switch id="app-create-emp" checked={createEmployee} onChange={setCreateEmployee} />
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
