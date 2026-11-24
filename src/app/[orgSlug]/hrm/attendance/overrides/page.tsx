'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { StatusBadge } from '@/components/hrm/status-badge';
import { Button, Card } from '@/components/ui/base';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { IconButton } from '@/components/ui/tooltip';
import { useEmployeeOptions } from '@/hooks/use-employee-options';
import { useAttendanceOverrides, useCreateOverride, useDeleteOverride, useUpdateOverride } from '@/hooks/use-attendance';
import { normalizeList } from '@/lib/api/drf';
import { OVERRIDE_TYPES, type AttendanceOverride, type OverrideType } from '@/lib/api/attendance';
import { PAGE_SIZE } from '@/lib/hrm';
import { formatDate } from '@/lib/utils';

const MANAGE = 'hrm.attendance.manage';
const PLANNER_REASON = 'Set in shift planner';

/** Hours for a row: a day off has none; otherwise the row's own times, else (for planner rows)
 *  the work shift's default times, with the shift's name when known. */
function overrideHours(o: AttendanceOverride): ReactNode {
    if (o.override_type === 'off_duty') return 'Day off';
    const start = o.start_time || o.shift_start_time;
    const end = o.end_time || o.shift_end_time;
    const hours = start ? `${start}–${end || '?'}` : null;
    if (!hours && !o.shift_name) return '—';
    return (
        <div>
            {hours ? <span>{hours}</span> : null}
            {o.shift_name ? <span className="block text-xs text-muted-foreground">{o.shift_name}</span> : null}
        </div>
    );
}

export default function AttendanceOverridesPage() {
    const { options: employees } = useEmployeeOptions();
    const [page, setPage] = useState(1);
    const { data, isLoading, error, refetch } = useAttendanceOverrides({ page, page_size: PAGE_SIZE });
    const create = useCreateOverride();
    const update = useUpdateOverride();
    const del = useDeleteOverride();
    const saving = create.isPending || update.isPending;
    const { results: rows, count } = normalizeList<AttendanceOverride>(data);
    const [editing, setEditing] = useState<AttendanceOverride | null>(null);
    const [toDelete, setToDelete] = useState<AttendanceOverride | null>(null);

    const empName = useMemo(() => {
        const m = new Map(employees.map((o) => [o.value, o.label]));
        return (id?: string) => (id ? (m.get(String(id)) ?? '—') : '—');
    }, [employees]);

    const [open, setOpen] = useState(false);
    const empty: {
        employee_id: string;
        date: string;
        override_type: OverrideType;
        start_time: string;
        end_time: string;
        reason: string;
        status: string;
    } = { employee_id: '', date: '', override_type: 'manual_shift', start_time: '', end_time: '', reason: '', status: 'approved' };
    const [form, setForm] = useState(empty);
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const isOff = form.override_type === 'off_duty';
    // A planner row keeps its work shift while it stays a changed shift, so its hours may be
    // left blank (they come from the shift).
    const shiftSuppliesHours = Boolean(editing?.work_shift_id) && form.override_type === 'manual_shift';
    // A changed shift or half day needs its hours; a day off has none.
    const valid = Boolean(form.employee_id && form.date && (isOff || shiftSuppliesHours || (form.start_time && form.end_time)));

    const openNew = () => {
        setEditing(null);
        setForm(empty);
        setOpen(true);
    };
    const openEdit = (o: AttendanceOverride) => {
        setEditing(o);
        setForm({
            employee_id: o.employee_id ?? '',
            date: o.date ? o.date.slice(0, 10) : '',
            override_type: o.override_type ?? 'manual_shift',
            start_time: o.start_time ?? '',
            end_time: o.end_time ?? '',
            reason: o.reason ?? '',
            status: o.status ?? 'approved'
        });
        setOpen(true);
    };
    const submit = () => {
        const payload = {
            employee_id: form.employee_id,
            date: form.date,
            override_type: form.override_type,
            start_time: isOff ? undefined : form.start_time || undefined,
            end_time: isOff ? undefined : form.end_time || undefined,
            reason: form.reason.trim() || undefined,
            status: form.status
        };
        const done = { onSuccess: () => setOpen(false) };
        if (editing) update.mutate({ id: editing.id, data: payload }, done);
        else create.mutate(payload, done);
    };

    const columns: Column<AttendanceOverride>[] = [
        { header: 'Employee', cell: (o) => <span className="font-medium">{o.employee_name || empName(o.employee_id)}</span> },
        { header: 'Date', cell: (o) => (o.date ? formatDate(o.date) : '—') },
        { header: 'Type', cell: (o) => OVERRIDE_TYPES.find((t) => t.value === o.override_type)?.label ?? o.override_type ?? '—' },
        { header: 'Hours', cell: (o) => overrideHours(o) },
        { header: 'Reason', cell: (o) => o.reason || (o.from_planner ? PLANNER_REASON : '—') },
        { header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
        {
            header: '',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (o) => (
                <PermissionGate permission={MANAGE}>
                    <div className="flex items-center justify-end gap-1">
                        <IconButton label="Edit override" onClick={() => openEdit(o)}>
                            <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label="Delete override" onClick={() => setToDelete(o)}>
                            <Trash2 className="size-4 text-destructive" />
                        </IconButton>
                    </div>
                </PermissionGate>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="Shift Overrides"
                subtitle="One-off changes to an employee's scheduled day"
                actions={
                    <PermissionGate permission={MANAGE}>
                        <Button size="sm" onClick={openNew}>
                            <Plus className="mr-1.5 size-4" /> New Override
                        </Button>
                    </PermissionGate>
                }
            />

            <Card>
                <DataTable columns={columns} rows={rows} rowKey={(o) => o.id} isLoading={isLoading} error={error} onRetry={refetch} emptyTitle="No overrides" emptyDescription="Add a one-off override for an employee's shift." />
                {count > 0 && (
                    <div className="border-t border-border p-3">
                        <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
                    </div>
                )}
            </Card>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Shift Override' : 'New Shift Override'}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button size="sm" disabled={!valid || saving} onClick={submit}>
                            {saving ? 'Saving…' : 'Save'}
                        </Button>
                    </>
                }
            >
                {editing?.from_planner ? (
                    <p className="mb-4 text-sm text-muted-foreground">
                        This day was set in the shift planner{editing.shift_name ? ` (${editing.shift_name})` : ''}. Changes show in the planner too
                        {editing.work_shift_id ? '; leave the times blank to keep the shift’s own hours' : ''}.
                    </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Employee" required>
                        <Select value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
                            <option value="">Select…</option>
                            {employees.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Date" required>
                        <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
                    </Field>
                    <Field label="Type" required>
                        <Select value={form.override_type} onChange={(e) => setForm((f) => ({ ...f, override_type: e.target.value as OverrideType }))}>
                            {OVERRIDE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Status">
                        <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            {editing ? <option value="rejected">Rejected</option> : null}
                        </Select>
                    </Field>
                    <Field label="Start Time" required={!isOff && !shiftSuppliesHours}>
                        <Input type="time" value={form.start_time} disabled={isOff} onChange={(e) => set('start_time', e.target.value)} />
                    </Field>
                    <Field label="End Time" required={!isOff && !shiftSuppliesHours}>
                        <Input type="time" value={form.end_time} disabled={isOff} onChange={(e) => set('end_time', e.target.value)} />
                    </Field>
                    <Field label="Reason" className="sm:col-span-2">
                        <Textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} />
                    </Field>
                </div>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete override?"
                description={toDelete?.from_planner ? 'This day was set in the shift planner, so its planner cell is cleared too. The employee falls back to their usual schedule.' : 'The employee falls back to their usual schedule for that day.'}
                destructive
                loading={del.isPending}
                onCancel={() => setToDelete(null)}
                onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
            />
        </div>
    );
}
