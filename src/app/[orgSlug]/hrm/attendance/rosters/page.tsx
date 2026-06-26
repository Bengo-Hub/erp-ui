"use client";

import { CalendarRange, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useDeleteRoster,
  useRosters,
  useRosterSlots,
  useSaveRoster,
  useUpsertRosterSlot,
} from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type RosterSlot, type ShiftRoster } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.attendance.manage";

/** Manage the per-(employee, cycle-day) slots of one rotating roster. */
function SlotsDialog({ roster, onClose }: { roster: ShiftRoster; onClose: () => void }) {
  const { options: employees } = useEmployeeOptions();
  const { data, isLoading } = useRosterSlots(roster.id);
  const upsert = useUpsertRosterSlot(roster.id);
  const slots = normalizeList<RosterSlot>(data).results;

  const cycleDays = Math.max(1, Number(roster.cycle_days) || 1);
  const empName = useMemo(() => {
    const m = new Map(employees.map((o) => [o.value, o.label]));
    return (id?: string) => (id ? m.get(String(id)) ?? "—" : "—");
  }, [employees]);

  const empty = { employee_id: "", cycle_day: 1, start_time: "08:00", end_time: "17:00", is_off_day: false };
  const [form, setForm] = useState(empty);
  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Slots — ${roster.name || "Roster"}`}
      description={`${cycleDays}-day cycle`}
      maxWidth="max-w-3xl"
      footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <PermissionGate permission={MANAGE}>
          <div className="grid items-end gap-3 rounded-lg border border-border p-3 sm:grid-cols-6">
            <Field label="Employee" className="sm:col-span-2">
              <Select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)}>
                <option value="">Select…</option>
                {employees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Day">
              <Select value={form.cycle_day} onChange={(e) => set("cycle_day", Number(e.target.value))}>
                {Array.from({ length: cycleDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Start">
              <Input type="time" value={form.start_time} disabled={form.is_off_day} onChange={(e) => set("start_time", e.target.value)} />
            </Field>
            <Field label="End">
              <Input type="time" value={form.end_time} disabled={form.is_off_day} onChange={(e) => set("end_time", e.target.value)} />
            </Field>
            <Field label="Off Day">
              <Switch checked={form.is_off_day} onChange={(c) => set("is_off_day", c)} id="slot-off" />
            </Field>
            <div className="sm:col-span-6 flex justify-end">
              <Button
                size="sm"
                disabled={!form.employee_id || upsert.isPending}
                onClick={() => upsert.mutate(form, { onSuccess: () => setForm(empty) })}
              >
                {upsert.isPending ? "Saving…" : "Save Slot"}
              </Button>
            </div>
          </div>
        </PermissionGate>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading slots…</p>
        ) : slots.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No slots defined yet.</p>
        ) : (
          <div className="space-y-1.5">
            {[...slots]
              .sort((a, b) => (a.cycle_day ?? 0) - (b.cycle_day ?? 0))
              .map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium">Day {s.cycle_day}</span>
                  <span className="text-muted-foreground">{empName(s.employee_id)}</span>
                  <span>{s.is_off_day ? "Off day" : `${s.start_time ?? "?"}–${s.end_time ?? "?"}`}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default function RostersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useRosters({ page, page_size: PAGE_SIZE });
  const save = useSaveRoster();
  const del = useDeleteRoster();
  const { results: rows, count } = normalizeList<ShiftRoster>(data);

  const [createOpen, setCreateOpen] = useState(false);
  const empty = { name: "", cycle_days: 7, start_date: "" };
  const [form, setForm] = useState(empty);
  const [slotsFor, setSlotsFor] = useState<ShiftRoster | null>(null);
  const [toDelete, setToDelete] = useState<ShiftRoster | null>(null);

  const columns: Column<ShiftRoster>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name || r.title || "—"}</span> },
    { header: "Cycle", cell: (r) => (r.cycle_days ? `${r.cycle_days} days` : "—") },
    { header: "Start", cell: (r) => (r.start_date ? formatDate(r.start_date) : "—") },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSlotsFor(r)}>
            <CalendarRange className="mr-1.5 size-4" /> Slots
          </Button>
          <PermissionGate permission={MANAGE}>
            <IconButton label="Delete roster" onClick={() => setToDelete(r)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Rosters"
        subtitle="Rotating shift rosters and their per-day slots"
        actions={
          <PermissionGate permission={MANAGE}>
            <Button size="sm" onClick={() => { setForm(empty); setCreateOpen(true); }}>
              <Plus className="mr-1.5 size-4" /> New Roster
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No rosters yet"
          emptyDescription="Create a rotating roster, then add per-day slots."
        />
        {count > 0 && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Roster"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button size="sm" disabled={!form.name.trim() || !form.start_date || save.isPending}
              onClick={() => save.mutate(form, { onSuccess: () => setCreateOpen(false) })}>
              {save.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Cycle Days" required help="Length of the rotation">
            <Input type="number" min={1} max={31} value={form.cycle_days}
              onChange={(e) => setForm((f) => ({ ...f, cycle_days: Math.max(1, Number(e.target.value) || 1) }))} />
          </Field>
          <Field label="Start Date" required>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </Field>
        </div>
      </Dialog>

      {slotsFor && <SlotsDialog roster={slotsFor} onClose={() => setSlotsFor(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete roster?"
        description="This removes the roster and its slots. This cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
