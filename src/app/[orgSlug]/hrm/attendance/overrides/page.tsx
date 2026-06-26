"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useAttendanceOverrides, useCreateOverride } from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { OVERRIDE_TYPES, type AttendanceOverride } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.attendance.manage";

export default function AttendanceOverridesPage() {
  const { options: employees } = useEmployeeOptions();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAttendanceOverrides({ page, page_size: PAGE_SIZE });
  const create = useCreateOverride();
  const { results: rows, count } = normalizeList<AttendanceOverride>(data);

  const empName = useMemo(() => {
    const m = new Map(employees.map((o) => [o.value, o.label]));
    return (id?: string) => (id ? m.get(String(id)) ?? "—" : "—");
  }, [employees]);

  const [open, setOpen] = useState(false);
  const empty = { employee_id: "", date: "", override_type: "extra_shift", start_time: "", end_time: "", reason: "", status: "approved" };
  const [form, setForm] = useState(empty);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isOff = form.override_type === "day_off";
  const valid = form.employee_id && form.date && form.override_type;

  const columns: Column<AttendanceOverride>[] = [
    { header: "Employee", cell: (o) => <span className="font-medium">{o.employee_name || empName(o.employee_id)}</span> },
    { header: "Date", cell: (o) => (o.date ? formatDate(o.date) : "—") },
    { header: "Type", cell: (o) => OVERRIDE_TYPES.find((t) => t.value === o.override_type)?.label ?? o.override_type ?? "—" },
    { header: "Hours", cell: (o) => (o.start_time ? `${o.start_time}–${o.end_time ?? "?"}` : "—") },
    { header: "Reason", cell: (o) => o.reason || "—" },
    { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Shift Overrides"
        subtitle="One-off changes to an employee's scheduled day"
        actions={
          <PermissionGate permission={MANAGE}>
            <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}>
              <Plus className="mr-1.5 size-4" /> New Override
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
          emptyTitle="No overrides"
          emptyDescription="Add a one-off override for an employee's shift."
        />
        {count > 0 && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New Shift Override"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={create.isPending}>Cancel</Button>
            <Button size="sm" disabled={!valid || create.isPending}
              onClick={() => create.mutate(form, { onSuccess: () => setOpen(false) })}>
              {create.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" required>
            <Select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)}>
              <option value="">Select…</option>
              {employees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Type" required>
            <Select value={form.override_type} onChange={(e) => set("override_type", e.target.value)}>
              {OVERRIDE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </Select>
          </Field>
          <Field label="Start Time">
            <Input type="time" value={form.start_time} disabled={isOff} onChange={(e) => set("start_time", e.target.value)} />
          </Field>
          <Field label="End Time">
            <Input type="time" value={form.end_time} disabled={isOff} onChange={(e) => set("end_time", e.target.value)} />
          </Field>
          <Field label="Reason" className="sm:col-span-2">
            <Textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
