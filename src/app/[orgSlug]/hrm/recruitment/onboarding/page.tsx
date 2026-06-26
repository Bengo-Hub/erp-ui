"use client";

import { ListChecks, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useCompleteOnboardingTask,
  useOnboarding,
  useOnboardingTasks,
  useStartOnboarding,
} from "@/hooks/use-recruitment";
import { normalizeList } from "@/lib/api/drf";
import { type Onboarding, type OnboardingTask } from "@/lib/api/recruitment";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const TASK_CATEGORIES = ["IT", "HR", "Training", "Other"] as const;

/** Checklist drawer for a single onboarding — tasks grouped by category, toggle to complete. */
function ChecklistDialog({ onboarding, onClose }: { onboarding: Onboarding; onClose: () => void }) {
  const { data, isLoading } = useOnboardingTasks(onboarding.id);
  const complete = useCompleteOnboardingTask();
  const tasks = normalizeList<OnboardingTask>(data).results;
  const done = tasks.filter((t) => t.is_done).length;

  const grouped = useMemo(() => {
    const by: Record<string, OnboardingTask[]> = {};
    for (const t of [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      const key = (t.category as string) || "Other";
      (by[key] ||= []).push(t);
    }
    return by;
  }, [tasks]);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Onboarding Checklist"
      description={`${done}/${tasks.length} tasks completed`}
      maxWidth="max-w-2xl"
      footer={
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading checklist…</p>
      ) : tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No tasks on this checklist.</p>
      ) : (
        <div className="space-y-4">
          {TASK_CATEGORIES.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h4>
              <div className="space-y-1.5">
                {grouped[cat].map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className={t.is_done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                      {t.title}
                    </span>
                    <PermissionGate permission="change_onboarding" fallback={<StatusBadge status={t.is_done ? "completed" : "pending"} />}>
                      <Switch
                        checked={!!t.is_done}
                        disabled={complete.isPending}
                        onChange={(checked) => complete.mutate({ taskId: t.id, done: checked })}
                        id={`task-${t.id}`}
                      />
                    </PermissionGate>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

export default function OnboardingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOnboarding({ page, page_size: PAGE_SIZE });
  const start = useStartOnboarding();
  const { options: employees } = useEmployeeOptions();
  const { results: rows, count } = normalizeList<Onboarding>(data);

  const empName = useMemo(() => {
    const map = new Map(employees.map((o) => [o.value, o.label]));
    return (id?: string) => (id ? map.get(String(id)) ?? "—" : "—");
  }, [employees]);

  const [startOpen, setStartOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [checklist, setChecklist] = useState<Onboarding | null>(null);

  const submitStart = () => {
    if (!employeeId) return;
    start.mutate(
      { data: { employee_id: employeeId } },
      {
        onSuccess: () => {
          setStartOpen(false);
          setEmployeeId("");
        },
      },
    );
  };

  const columns: Column<Onboarding>[] = [
    {
      header: "Employee",
      cell: (o) => <span className="font-medium">{o.employee_name || empName(o.employee_id)}</span>,
    },
    { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { header: "Started", cell: (o) => (o.started_at ? formatDate(o.started_at) : "—") },
    { header: "Probation End", cell: (o) => (o.probation_end_date ? formatDate(o.probation_end_date) : "—") },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (o) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setChecklist(o)}>
            <ListChecks className="mr-1.5 size-4" /> Checklist
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Onboarding"
        subtitle="New-hire onboarding records and checklists"
        actions={
          <PermissionGate permission="add_onboarding">
            <Button size="sm" onClick={() => setStartOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Start Onboarding
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No onboardings yet"
          emptyDescription="Start onboarding for a new hire to seed their checklist."
        />
        {count > 0 && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start Onboarding"
        description="Pick an employee to seed their default onboarding checklist."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setStartOpen(false)} disabled={start.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitStart} disabled={!employeeId || start.isPending}>
              {start.isPending ? "Starting…" : "Start"}
            </Button>
          </>
        }
      >
        <Field label="Employee" htmlFor="onb-employee" required>
          <Select id="onb-employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </Dialog>

      {checklist && <ChecklistDialog onboarding={checklist} onClose={() => setChecklist(null)} />}
    </div>
  );
}
