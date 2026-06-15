"use client";

import { Plus, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useDeleteGoal,
  useGoals,
  useSaveGoal,
  useUpdateGoalProgress,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { type Goal } from "@/lib/api/appraisals";
import { formatDate } from "@/lib/utils";

const empty = { employee: "", title: "", description: "", category: "", target_date: "", weight: "" };

export default function GoalsPage() {
  const { options: employees } = useEmployeeOptions();
  const [tab, setTab] = useState<"all" | "library">("all");

  const params = useMemo(
    () => (tab === "library" ? { is_library: true, page_size: 200 } : { page_size: 200 }),
    [tab],
  );
  const { data, isLoading, error, refetch } = useGoals(params);
  const save = useSaveGoal();
  const del = useDeleteGoal();
  const progress = useUpdateGoalProgress();
  const rows = normalizeList<Goal>(data).results;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(empty);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressVal, setProgressVal] = useState("");

  const open = (g?: Goal) => {
    setEditing(g ?? null);
    setForm(
      g
        ? {
            employee: g.employee ? String(g.employee) : "",
            title: g.title ?? "",
            description: g.description ?? "",
            category: g.category ?? "",
            target_date: g.target_date ?? g.due_date ?? "",
            weight: g.weight != null ? String(g.weight) : "",
          }
        : empty,
    );
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    save.mutate(
      {
        id: editing?.id,
        data: {
          // employee id is a UUID string — do not Number() it.
          employee: form.employee || undefined,
          title: form.title,
          description: form.description || undefined,
          category: form.category || undefined,
          target_date: form.target_date || undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          is_library: tab === "library" ? true : undefined,
        } as Partial<Goal>,
      },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const columns: Column<Goal>[] = [
    { header: "Goal", cell: (g) => <span className="font-medium">{g.title || "—"}</span> },
    ...(tab === "all"
      ? [{ header: "Employee", cell: (g: Goal) => g.employee_name || g.employee || "—" }]
      : []),
    { header: "Category", cell: (g) => g.category || "—" },
    {
      header: "Progress",
      cell: (g) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, Number(g.progress) || 0)}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{Number(g.progress) || 0}%</span>
        </div>
      ),
    },
    { header: "Target", cell: (g) => formatDate(g.target_date || g.due_date) },
    { header: "Status", cell: (g) => <StatusBadge status={g.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (g) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_goal">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Update progress"
              onClick={() => {
                setProgressGoal(g);
                setProgressVal(String(g.progress ?? ""));
              }}
            >
              <TrendingUp className="size-4 text-primary" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => open(g)}>
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_goal">
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => del.mutate(g.id)}>
              Delete
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Goals"
        subtitle="Performance goals and the goal library"
        actions={
          <PermissionGate permission="add_goal">
            <Button size="sm" onClick={() => open()}>
              <Plus className="mr-1.5 size-4" /> New Goal
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-border px-4 pt-2">
          <Tabs
            tabs={[
              { key: "all", label: "All Goals" },
              { key: "library", label: "Goal Library" },
            ]}
            active={tab}
            onChange={(k) => setTab(k as "all" | "library")}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(g) => g.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={tab === "library" ? "Empty library" : "No goals"}
          emptyDescription={
            tab === "library"
              ? "Add reusable goals to the library."
              : "Set goals to track employee performance."
          }
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${editing ? "Edit" : "New"} Goal`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="g-title" required className="sm:col-span-2">
            <Input id="g-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          {tab === "all" && (
            <Field label="Employee" htmlFor="g-emp">
              <Select id="g-emp" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
                <option value="">Select employee…</option>
                {employees.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Category" htmlFor="g-cat">
            <Input id="g-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <Field label="Target Date" htmlFor="g-target">
            <Input id="g-target" type="date" value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} />
          </Field>
          <Field label="Weight" htmlFor="g-weight">
            <Input id="g-weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          </Field>
          <Field label="Description" htmlFor="g-desc" className="sm:col-span-2">
            <Textarea id="g-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={!!progressGoal}
        onClose={() => setProgressGoal(null)}
        title="Update Progress"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setProgressGoal(null)} disabled={progress.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                progressGoal &&
                progress.mutate(
                  { id: progressGoal.id, progress: Number(progressVal) },
                  { onSuccess: () => setProgressGoal(null) },
                )
              }
              disabled={progress.isPending}
            >
              {progress.isPending ? "Saving…" : "Update"}
            </Button>
          </>
        }
      >
        <Field label="Progress (%)" htmlFor="g-progress">
          <Input
            id="g-progress"
            type="number"
            min="0"
            max="100"
            value={progressVal}
            onChange={(e) => setProgressVal(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}
