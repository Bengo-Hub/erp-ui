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
import { type LeaveCategory, type LeavePreview, type LeavePreviewParams, type LeaveRequest } from '@/lib/api/leave';
import { formatDate } from '@/lib/utils';
import { endNotBeforeStart } from '@/lib/validation';

// start_half: the leave starts at midday on the start date; end_half: it ends at midday on the
// end date. On a one-day request they mean the afternoon off and the morning off.
const EMPTY = { employee: '', leave_category: '', start_date: '', end_date: '', start_half: false, end_half: false, reason: '' };
type LeaveForm = typeof EMPTY;

/** The form values of a request being edited. */
function formOf(r: LeaveRequest): LeaveForm {
    return {
        employee: String(r.employee_id ?? r.employee ?? ''),
        leave_category: String(r.category_id ?? r.leave_category ?? ''),
        start_date: (r.start_date ?? '').slice(0, 10),
        end_date: (r.end_date ?? '').slice(0, 10),
        start_half: Boolean(r.start_half_day),
        end_half: Boolean(r.end_half_day),
        reason: r.reason ?? ''
    };
}

/** Which part of the day(s) the request takes: one select for a one-day request, two otherwise. */
function DayParts({ form, onChange }: { form: LeaveForm; onChange: (start: boolean, end: boolean) => void }) {
    if (!form.start_date || !form.end_date || form.end_date < form.start_date) return null;
    if (form.start_date === form.end_date) {
        const value = form.start_half ? 'afternoon' : form.end_half ? 'morning' : 'full';
        return (
            <Field label="Part of the day" htmlFor="day_part">
                <Select id="day_part" value={value} onChange={(e) => onChange(e.target.value === 'afternoon', e.target.value === 'morning')}>
                    <option value="full">Full day</option>
                    <option value="morning">Morning only (half day)</option>
                    <option value="afternoon">Afternoon only (half day)</option>
                </Select>
            </Field>
        );
    }
    return (
        <>
            <Field label="First day" htmlFor="start_part">
                <Select id="start_part" value={form.start_half ? 'half' : 'full'} onChange={(e) => onChange(e.target.value === 'half', form.end_half)}>
                    <option value="full">Full day</option>
                    <option value="half">From midday (half day)</option>
                </Select>
            </Field>
            <Field label="Last day" htmlFor="end_part">
                <Select id="end_part" value={form.end_half ? 'half' : 'full'} onChange={(e) => onChange(form.start_half, e.target.value === 'half')}>
                    <option value="full">Full day</option>
                    <option value="half">Until midday (half day)</option>
                </Select>
            </Field>
        </>
    );
}

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
    const pending = Number(preview.pending_days);
    return (
        <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-sm" role="status">
            <p className="font-semibold text-foreground">{days > 0 ? `${days} ${unit}` : 'These dates have no working days, so there is nothing to apply for.'}</p>
            {holidays.length > 0 ? <p className="text-muted-foreground">Public holidays not counted: {holidays.map((h) => `${h.name || 'Holiday'} (${formatDate(h.date)})`).join(', ')}</p> : null}
            {off > 0 ? <p className="text-muted-foreground">{off === 1 ? '1 non-working day not counted' : `${off} non-working days not counted`}</p> : null}
            {half > 0 ? <p className="text-muted-foreground">{half === 1 ? '1 half day counted as half' : `${half} half days counted as half`}</p> : null}
            {balance == null ? (
                <p className="text-amber-700 dark:text-amber-400">No {preview.balance_year} balance is set for this leave type, so it cannot be checked.</p>
            ) : (
                <p className="text-muted-foreground">
                    {preview.balance_year} balance: {balance} days{pending > 0 ? `, ${pending} already in pending requests` : ''}
                </p>
            )}
            {preview.balance_message ? (
                <p className={preview.refused ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'}>
                    {preview.refused ? 'Cannot submit: ' : 'Warning: '}
                    {preview.balance_message}.
                </p>
            ) : null}
        </div>
    );
}

/**
 * Apply-for-leave modal. With `self` the request is for the signed-in person and the employee
 * picker is hidden; otherwise HR picks the employee. With `request` it edits that pending request
 * (the employee stays; the days and the balance check are counted again).
 */
export function LeaveFormDialog({ open, onClose, self = false, request = null }: { open: boolean; onClose: () => void; self?: boolean; request?: LeaveRequest | null }) {
    const { data: catData } = useLeaveCategories({ limit: 200 });
    // Only types that take new requests (a switched-off type is refused by the API), plus the
    // type of the request being edited.
    const categories = normalizeList<LeaveCategory>(catData).results.filter((c) => c.is_active !== false || (request != null && String(c.id) === String(request.category_id)));
    const save = useSaveLeaveRequest();
    const editing = request != null;

    const [form, setForm] = useState<LeaveForm>(EMPTY);
    // Reset the form each time the dialog opens, without a setState-in-effect (React's
    // "store previous value during render" pattern).
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setForm(request ? formOf(request) : EMPTY);
    }
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const parsed = useMemo(() => leaveSchema.safeParse(form), [form]);
    const complete = parsed.success && (self || editing || form.employee !== '');
    const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

    const previewParams: LeavePreviewParams | null =
        open && complete
            ? {
                  employee_id: request ? request.employee_id : self ? undefined : form.employee,
                  category_id: form.leave_category,
                  start_date: form.start_date,
                  end_date: form.end_date,
                  start_half_day: form.start_half,
                  end_half_day: form.end_half,
                  request_id: request ? String(request.id) : undefined
              }
            : null;
    const preview = useLeavePreview(previewParams);
    const valid = complete && Number(preview.data?.days ?? 0) > 0 && !preview.data?.refused;

    const submit = () => {
        if (!valid) return;
        save.mutate(
            {
                id: request?.id,
                data: {
                    // employee/category ids are UUID strings; do not Number() them. An edit keeps
                    // the employee.
                    employee: self || editing ? undefined : form.employee,
                    leave_category: form.leave_category,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    start_half_day: form.start_half,
                    end_half_day: form.end_half,
                    // An edit sends the reason as is, so clearing it clears it.
                    reason: editing ? form.reason : form.reason || undefined
                }
            },
            { onSuccess: onClose }
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={editing ? 'Edit Leave Request' : 'Apply for Leave'}
            description={request ? `Change this pending request${request.employee_name ? ` for ${request.employee_name}` : ''}; the days and the balance are counted again.` : 'Submit a new leave request for approval.'}
            maxWidth="max-w-2xl"
            footer={
                <>
                    <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
                        {save.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Submit Request'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {self || editing ? null : <EmployeePicker value={form.employee} onChange={(v) => set('employee', v)} />}
                    <Field label="Leave Type" htmlFor="leave_category" required className={self || editing ? 'sm:col-span-2' : undefined}>
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
                    <DayParts form={form} onChange={(start, end) => setForm((f) => ({ ...f, start_half: start, end_half: end }))} />
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
