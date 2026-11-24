'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/base';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useEmployeeOptions } from '@/hooks/use-employee-options';
import { useLeaveCategories, useLeavePreview, useSaveLeaveRequest } from '@/hooks/use-leave';
import { normalizeList } from '@/lib/api/drf';
import { extractApiError } from '@/lib/api/error';
import { type LeaveCategory, type LeavePreview, type LeavePreviewParams } from '@/lib/api/leave';
import { formatDate } from '@/lib/utils';
import { endNotBeforeStart } from '@/lib/validation';

const EMPTY = { employee: '', leave_category: '', start_date: '', end_date: '', reason: '' };

const leaveSchema = z
    .object({
        employee: z.string(),
        leave_category: z.string().min(1, 'Select a leave type'),
        start_date: z.string().min(1, 'Start date is required'),
        end_date: z.string().min(1, 'End date is required'),
        reason: z.string().optional()
    })
    .refine(endNotBeforeStart('start_date', 'end_date'), {
        message: 'End date must not be before start date',
        path: ['end_date']
    });

/** Own component, so staff filing for themselves never load the employee list. */
function EmployeePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const { options } = useEmployeeOptions();
    return (
        <Field label="Employee" htmlFor="employee" required>
            <Select id="employee" value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="">Select employee…</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </Select>
        </Field>
    );
}

/** The server's count for the chosen dates: total, holidays skipped, balance. */
function PreviewNote({ preview }: { preview: LeavePreview }) {
    const days = Number(preview.days);
    const unit = `${preview.count_mode === 'calendar_days' ? 'calendar' : 'working'} ${days === 1 ? 'day' : 'days'}`;
    const holidays = preview.skipped.filter((s) => s.reason === 'public_holiday');
    const off = preview.skipped.filter((s) => s.reason === 'day_off').length;
    const half = preview.skipped.filter((s) => s.reason === 'half_day').length;
    const balance = preview.remaining_balance == null ? null : Number(preview.remaining_balance);
    return (
        <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-sm" role="status">
            <p className="font-semibold text-foreground">{days > 0 ? `${days} ${unit}` : 'These dates have no working days, so there is nothing to apply for.'}</p>
            {holidays.length > 0 ? <p className="text-muted-foreground">Public holidays not counted: {holidays.map((h) => `${h.name || 'Holiday'} (${formatDate(h.date)})`).join(', ')}</p> : null}
            {off > 0 ? <p className="text-muted-foreground">{off === 1 ? '1 non-working day not counted' : `${off} non-working days not counted`}</p> : null}
            {half > 0 ? <p className="text-muted-foreground">{half === 1 ? '1 half day counted as half' : `${half} half days counted as half`}</p> : null}
            <p className="text-muted-foreground">{balance == null ? `No ${preview.balance_year} balance for this leave type yet` : `${preview.balance_year} balance: ${balance} days`}</p>
            {balance != null && days > balance ? <p className="text-destructive">This is more than the remaining balance. The approver decides.</p> : null}
        </div>
    );
}

/**
 * Apply-for-leave modal. With `self` the request is for the signed-in person and the employee
 * picker is hidden; otherwise HR picks the employee.
 */
export function LeaveFormDialog({ open, onClose, self = false }: { open: boolean; onClose: () => void; self?: boolean }) {
    const { data: catData } = useLeaveCategories({ limit: 200 });
    const categories = normalizeList<LeaveCategory>(catData).results;
    const save = useSaveLeaveRequest();

    const [form, setForm] = useState(EMPTY);
    // Reset the form each time the dialog opens, without a setState-in-effect (React's
    // "store previous value during render" pattern).
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setForm(EMPTY);
    }
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const parsed = useMemo(() => leaveSchema.safeParse(form), [form]);
    const complete = parsed.success && (self || form.employee !== '');
    const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

    const previewParams: LeavePreviewParams | null =
        open && complete
            ? {
                  employee_id: self ? undefined : form.employee,
                  category_id: form.leave_category,
                  start_date: form.start_date,
                  end_date: form.end_date
              }
            : null;
    const preview = useLeavePreview(previewParams);
    const valid = complete && Number(preview.data?.days ?? 0) > 0;

    const submit = () => {
        if (!valid) return;
        save.mutate(
            {
                data: {
                    // employee/category ids are UUID strings; do not Number() them.
                    employee: self ? undefined : form.employee,
                    leave_category: form.leave_category,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    reason: form.reason || undefined
                }
            },
            { onSuccess: onClose }
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Apply for Leave"
            description="Submit a new leave request for approval."
            maxWidth="max-w-2xl"
            footer={
                <>
                    <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
                        {save.isPending ? 'Submitting…' : 'Submit Request'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {self ? null : <EmployeePicker value={form.employee} onChange={(v) => set('employee', v)} />}
                    <Field label="Leave Type" htmlFor="leave_category" required className={self ? 'sm:col-span-2' : undefined}>
                        <Select id="leave_category" value={form.leave_category} onChange={(e) => set('leave_category', e.target.value)}>
                            <option value="">Select type…</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Start Date" htmlFor="start_date" required>
                        <Input id="start_date" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
                    </Field>
                    <Field label="End Date" htmlFor="end_date" required error={fieldErrors.end_date?.[0]}>
                        <Input id="end_date" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
                    </Field>
                </div>
                {preview.data ? <PreviewNote preview={preview.data} /> : null}
                {preview.isFetching && !preview.data ? <p className="text-sm text-muted-foreground">Counting days…</p> : null}
                {preview.error ? (
                    <p className="text-sm text-destructive" role="alert">
                        {extractApiError(preview.error, 'Could not count the days')}
                    </p>
                ) : null}
                <Field label="Reason" htmlFor="reason">
                    <Textarea id="reason" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Reason for leave (optional)…" />
                </Field>
            </div>
        </Dialog>
    );
}
