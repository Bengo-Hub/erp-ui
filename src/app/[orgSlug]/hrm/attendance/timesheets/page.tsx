"use client";

import { Plus, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useApproveTimesheet,
  useRejectTimesheet,
  useSaveTimesheet,
  useSubmitTimesheet,
  useTimesheets,
} from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type Timesheet } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

export default function TimesheetsPage() {
  const { options: employees } = useEmployeeOptions();
  const [tab, setTab] = useState<"all" | "approvals">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee: "", period_start: "", period_end: "" });

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      status: tab === "approvals" ? "submitted" : undefined,
    }),
    [page, tab],
  );
  const { data, isLoading, error, refetch } = useTimesheets(params);
  const save = useSaveTimesheet();
  const submit = useSubmitTimesheet();
  const approve = useApproveTimesheet();
  const reject = useRejectTimesheet();
  const { results, count } = normalizeList<Timesheet>(data);

  const isPending = (t: Timesheet) => ["submitted", "pending"].includes((t.status || "").toLowerCase());
  const isDraft = (t: Timesheet) => ["draft", ""].includes((t.status || "").toLowerCase());

  const columns: Column<Timesheet>[] = [
    {
      header: "Employee",
      cell: (t) => <span className="font-medium">{t.employee_name || t.employee || "—"}</span>,
    },
    { header: "Period", cell: (t) => `${formatDate(t.period_start ?? t.start_date)} – ${formatDate(t.period_end ?? t.end_date)}` },
    { header: "Total Hours", cell: (t) => t.total_hours ?? "—" },
    { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          {isDraft(t) && (
            <PermissionGate permission="change_timesheet">
              <IconButton label="Submit timesheet" onClick={() => submit.mutate(t.id)}>
                <Send className="size-4 text-primary" />
              </IconButton>
            </PermissionGate>
          )}
          <ApprovalActions
            size="sm"
            pending={isPending(t)}
            permission={["approve_timesheet", "change_timesheet"]}
            onApprove={() => approve.mutate(t.id)}
            onReject={(reason) => reject.mutate({ id: t.id, reason })}
            approving={approve.isPending}
            rejecting={reject.isPending}
          />
        </div>
      ),
    },
  ];

  const submitForm = () => {
    if (!form.employee || !form.period_start || !form.period_end) return;
    save.mutate(
      {
        data: {
          // employee id is a UUID string — do not Number() it.
          employee: form.employee,
          period_start: form.period_start,
          period_end: form.period_end,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ employee: "", period_start: "", period_end: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Timesheets"
        subtitle="Track and approve logged work hours"
        actions={
          <PermissionGate permission="add_timesheet">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 size-4" /> New Timesheet
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-border px-4 pt-2">
          <Tabs
            tabs={[
              { key: "all", label: "All Timesheets" },
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
          rowKey={(t) => t.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={tab === "approvals" ? "Nothing to approve" : "No timesheets"}
          emptyDescription={
            tab === "approvals"
              ? "There are no submitted timesheets awaiting approval."
              : "Create a timesheet to start logging hours."
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
        title="New Timesheet"
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
          <Field label="Employee" htmlFor="ts-emp" required className="sm:col-span-2">
            <Select id="ts-emp" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
              <option value="">Select employee…</option>
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Period Start" htmlFor="ts-start" required>
            <Input id="ts-start" type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
          </Field>
          <Field label="Period End" htmlFor="ts-end" required>
            <Input id="ts-end" type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
