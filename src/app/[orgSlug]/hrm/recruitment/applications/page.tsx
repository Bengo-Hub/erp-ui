"use client";

import { ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useAdvanceApplication,
  useApplications,
  useRejectApplication,
} from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import { APPLICATION_STAGES, type JobApplication } from "@/lib/api/recruitment";

export default function ApplicationsPipelinePage() {
  const { data, isLoading, error, refetch } = useApplications({ page_size: 500 });
  const advance = useAdvanceApplication();
  const reject = useRejectApplication();
  const apps = normalizeList<JobApplication>(data).results;

  const byStage = useMemo(() => {
    const groups: Record<string, JobApplication[]> = {};
    for (const s of APPLICATION_STAGES) groups[s.value] = [];
    const other: JobApplication[] = [];
    for (const a of apps) {
      const stage = (a.stage || a.status || "applied").toLowerCase();
      if (groups[stage]) groups[stage].push(a);
      else other.push(a);
    }
    if (other.length) groups[APPLICATION_STAGES[0].value].push(...other);
    return groups;
  }, [apps]);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {APPLICATION_STAGES.map((stage) => (
            <div key={stage.value} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-foreground">{stage.label}</h3>
                <Badge variant="secondary">{byStage[stage.value]?.length ?? 0}</Badge>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-2">
                {(byStage[stage.value] ?? []).length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
                ) : (
                  byStage[stage.value].map((a) => {
                    const terminal = ["hired", "rejected"].includes(stage.value);
                    return (
                      <Card key={a.id} className="border-border">
                        <div className="space-y-2 p-3">
                          <p className="text-sm font-medium text-foreground">
                            {a.candidate_name || `Candidate #${a.candidate}`}
                          </p>
                          {a.job_title && (
                            <p className="text-xs text-muted-foreground">{a.job_title}</p>
                          )}
                          {!terminal && (
                            <PermissionGate permission="change_jobapplication">
                              <div className="flex gap-1 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => advance.mutate({ id: a.id, stage: stage.value })}
                                  disabled={advance.isPending}
                                >
                                  Advance <ChevronRight className="ml-1 size-3.5" />
                                </Button>
                                <IconButton
                                  label="Reject application"
                                  onClick={() => reject.mutate({ id: a.id })}
                                  disabled={reject.isPending}
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
    </div>
  );
}
