"use client";

import { Pencil, Play, Plus, RotateCcw, Square, Trash2 } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useActivateCycle,
  useAppraisalCycles,
  useCloseCycle,
  useDeleteAppraisalCycle,
  useReopenCycle,
  useSaveAppraisalCycle,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { APPRAISAL_CYCLE_STATUS_LABELS, type AppraisalCycle } from "@/lib/api/appraisals";
import { PAGE_SIZE } from "@/lib/hrm";
import { endNotBeforeStart } from "@/lib/validation";
import { formatDate } from "@/lib/utils";

const empty = { name: "", description: "", start_date: "", end_date: "" };

export default function AppraisalCyclesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAppraisalCycles({ page, page_size: PAGE_SIZE });
  const save = useSaveAppraisalCycle();
  const del = useDeleteAppraisalCycle();
  const activate = useActivateCycle();
  const close = useCloseCycle();
  const reopen = useReopenCycle();
  const { results: rows, count } = normalizeList<AppraisalCycle>(data);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppraisalCycle | null>(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<AppraisalCycle | null>(null);

  const open = (c?: AppraisalCycle) => {
    setEditing(c ?? null);
    setForm(
      c
        ? {
            name: c.name ?? "",
            description: c.description ?? "",
            // The API returns timestamps; the date inputs take YYYY-MM-DD.
            start_date: (c.start_date ?? "").slice(0, 10),
            end_date: (c.end_date ?? "").slice(0, 10),
          }
        : empty,
    );
    setDialogOpen(true);
  };

  const dateRangeValid = endNotBeforeStart<typeof form>("start_date", "end_date")(form);

  const submit = () => {
    if (!form.name.trim() || !dateRangeValid) return;
    save.mutate({ id: editing?.id, data: form }, { onSuccess: () => setDialogOpen(false) });
  };

  const columns: Column<AppraisalCycle>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name || "—"}</span> },
    { header: "Start", cell: (c) => formatDate(c.start_date) },
    { header: "End", cell: (c) => formatDate(c.end_date) },
    { header: "Status", cell: (c) => <StatusBadge status={c.status} labels={APPRAISAL_CYCLE_STATUS_LABELS} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => {
        // erp-api cycle states: created -> activated -> closed -> reopened -> closed.
        const status = c.status || "created";
        const active = status === "activated" || status === "reopened";
        const closed = status === "closed";
        return (
          <div className="flex justify-end gap-1">
            <PermissionGate permission="change_appraisalcycle">
              {status === "created" && (
                <IconButton label="Activate cycle" onClick={() => activate.mutate(c.id)}>
                  <Play className="size-4 text-green-600" />
                </IconButton>
              )}
              {active && (
                <IconButton label="Close cycle" onClick={() => close.mutate(c.id)}>
                  <Square className="size-4 text-yellow-600" />
                </IconButton>
              )}
              {closed && (
                <IconButton label="Reopen cycle" onClick={() => reopen.mutate(c.id)}>
                  <RotateCcw className="size-4 text-primary" />
                </IconButton>
              )}
              <IconButton label="Edit cycle" onClick={() => open(c)}>
                <Pencil className="size-4" />
              </IconButton>
            </PermissionGate>
            <PermissionGate permission="delete_appraisalcycle">
              <IconButton label="Delete cycle" onClick={() => setToDelete(c)}>
                <Trash2 className="size-4 text-destructive" />
              </IconButton>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Appraisal Cycles"
        subtitle="Review periods governing appraisals"
        actions={
          <PermissionGate permission="add_appraisalcycle">
            <Button size="sm" onClick={() => open()}>
              <Plus className="mr-1.5 size-4" /> New Cycle
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No cycles"
          emptyDescription="Create an appraisal cycle to schedule reviews."
        />
        {count > 0 && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${editing ? "Edit" : "New"} Cycle`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending || !form.name.trim() || !dateRangeValid}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="cy-name" required className="sm:col-span-2">
            <Input id="cy-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Start Date" htmlFor="cy-start">
            <Input id="cy-start" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </Field>
          <Field label="End Date" htmlFor="cy-end" error={!dateRangeValid ? "End date must not be before start date" : undefined}>
            <Input id="cy-end" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
          </Field>
          <Field label="Description" htmlFor="cy-desc" className="sm:col-span-2">
            <Textarea id="cy-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete cycle?"
        description="A cycle that already holds appraisals cannot be deleted; close it instead. This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
