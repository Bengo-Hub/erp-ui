'use client';

import { DataTable, type DataTableColumn } from '@bengo-hub/shared-ui-lib/data-table';
import { formatCurrency } from '@bengo-hub/shared-ui-lib/format';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button, Card } from '@/components/ui/base';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Switch } from '@/components/ui/form';
import { IconButton } from '@/components/ui/tooltip';
import { useAssignableComponents, useDeleteEmployeeComponent, useEmployeeComponents, useSaveEmployeeComponent } from '@/hooks/use-payroll-settings';
import { type EmployeeComponent, type EmployeeComponentInput, type PayrollComponent } from '@/lib/api/payroll-settings';

type FormState = {
    component_id: string;
    calculation: 'amount' | 'percentage';
    amount: string;
    percentage: string;
    percent_of: 'basic' | 'gross';
    reference: string;
    start_month: string;
    end_month: string;
    is_active: boolean;
};

const EMPTY: FormState = {
    component_id: '',
    calculation: 'amount',
    amount: '',
    percentage: '',
    percent_of: 'basic',
    reference: '',
    start_month: '',
    end_month: '',
    is_active: true
};

/** How an assignment's value reads in the list: "KES 5,000.00" or "10% of basic". */
function valueText(a: EmployeeComponent): string {
    if (a.calculation === 'percentage') {
        return `${Number(a.percentage)}% of ${a.percent_of === 'gross' ? 'gross' : 'basic'} pay`;
    }
    return formatCurrency(Number(a.amount), 'KES');
}

function monthsText(a: EmployeeComponent): string {
    if (!a.start_month && !a.end_month) return 'Every month';
    if (a.start_month && !a.end_month) return `From ${a.start_month}`;
    if (!a.start_month && a.end_month) return `Until ${a.end_month}`;
    return `${a.start_month} to ${a.end_month}`;
}

/**
 * Earnings and deductions given to this employee from the components the organisation has
 * switched on (Settings, Payroll). Payroll runs apply them each month in their date range; a
 * component the organisation switches off stops applying even if it is still listed here.
 */
export function PayComponentsTab({ employeeId }: { employeeId: string }) {
    const params = useParams();
    const orgSlug = params?.orgSlug as string;
    const { data, isLoading, error, refetch } = useEmployeeComponents(employeeId);
    const { data: available = [], isLoading: loadingComponents } = useAssignableComponents();
    const save = useSaveEmployeeComponent(employeeId);
    const del = useDeleteEmployeeComponent(employeeId);
    const rows = data?.results ?? [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeComponent | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [toDelete, setToDelete] = useState<EmployeeComponent | null>(null);
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

    const selected: PayrollComponent | undefined = available.find((c) => String(c.id) === form.component_id);
    const isBenefit = selected?.category === 'Benefits' || editing?.category === 'Benefits';
    const referenceLabel = selected?.reference_label || editing?.reference_label || '';
    const referenceRequired = !!referenceLabel && (selected?.category ?? editing?.category) === 'Deductions';

    const options = useMemo(
        () =>
            available.map((c) => ({
                value: String(c.id),
                label: `${c.name} (${c.category === 'Deductions' ? 'deduction' : c.category === 'Benefits' ? 'benefit' : 'earning'})`
            })),
        [available]
    );

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setDialogOpen(true);
    };
    const openEdit = (a: EmployeeComponent) => {
        setEditing(a);
        setForm({
            component_id: a.component_id ?? '',
            calculation: a.calculation,
            amount: a.calculation === 'amount' && Number(a.amount) > 0 ? a.amount : '',
            percentage: a.calculation === 'percentage' ? a.percentage : '',
            percent_of: a.percent_of === 'gross' ? 'gross' : 'basic',
            reference: a.reference ?? '',
            start_month: a.start_month ?? '',
            end_month: a.end_month ?? '',
            is_active: a.is_active
        });
        setDialogOpen(true);
    };
    // A new component starts from its organisation default (a rate shows as a percentage).
    const pickComponent = (id: string) => {
        const c = available.find((x) => String(x.id) === id);
        const pct = Number(c?.percentage ?? 0);
        setForm((f) => ({
            ...f,
            component_id: id,
            calculation: pct > 0 && c?.category !== 'Benefits' ? 'percentage' : 'amount',
            percentage: pct > 0 ? String(pct) : '',
            percent_of: c?.percent_of === 'gross' ? 'gross' : 'basic',
            amount: Number(c?.amount ?? 0) > 0 ? String(c?.amount) : ''
        }));
    };

    const canSave = !!form.component_id && (form.calculation === 'amount' ? Number(form.amount) > 0 : Number(form.percentage) > 0) && (!referenceRequired || form.reference.trim() !== '');

    const onSubmit = () => {
        const payload: EmployeeComponentInput = {
            component_id: form.component_id,
            reference: form.reference.trim(),
            start_month: form.start_month,
            end_month: form.end_month,
            is_active: form.is_active
        };
        if (form.calculation === 'percentage' && !isBenefit) {
            payload.percentage = form.percentage;
            payload.percent_of = form.percent_of;
        } else {
            payload.amount = form.amount;
        }
        save.mutate({ id: editing?.id, data: payload }, { onSuccess: () => setDialogOpen(false) });
    };

    const columns: DataTableColumn<EmployeeComponent>[] = [
        {
            key: 'title',
            header: 'Component',
            primary: true,
            render: (a) => (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    {!a.component_active && <Badge variant="warning">Switched off for the organisation</Badge>}
                    {!a.is_active && <Badge variant="secondary">Paused</Badge>}
                </div>
            )
        },
        {
            key: 'category',
            header: 'Type',
            render: (a) =>
                a.category === 'Deductions' ? (
                    <Badge variant="error">Deduction</Badge>
                ) : a.category === 'Benefits' ? (
                    <Badge variant="secondary">Benefit</Badge>
                ) : (
                    <Badge variant="success">{a.is_taxable === false ? 'Earning, non-taxable' : 'Earning'}</Badge>
                )
        },
        { key: 'value', header: 'Value', accessor: (a) => valueText(a), render: (a) => valueText(a) },
        { key: 'months', header: 'Months', accessor: (a) => monthsText(a), render: (a) => monthsText(a) },
        { key: 'reference', header: 'Reference', render: (a) => a.reference || 'None' },
        {
            key: 'actions',
            header: '',
            align: 'right',
            mobileAction: true,
            exportable: false,
            render: (a) => (
                <PermissionGate permission="hrm.payroll.manage">
                    <div className="flex justify-end gap-1">
                        <IconButton label="Edit assignment" onClick={() => openEdit(a)}>
                            <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label="Remove assignment" onClick={() => setToDelete(a)}>
                            <Trash2 className="size-4 text-destructive" />
                        </IconButton>
                    </div>
                </PermissionGate>
            )
        }
    ];

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground">Earnings and deductions</h3>
                    <p className="text-xs text-muted-foreground">
                        Allowances, SACCO, HELB and other items paid or deducted in this employee&apos;s payroll each month. Only components switched on in{' '}
                        <Link href={`/${orgSlug}/settings/payroll`} className="text-primary hover:underline">
                            payroll settings
                        </Link>{' '}
                        can be assigned.
                    </p>
                </div>
                <PermissionGate permission="hrm.payroll.manage">
                    <Button size="sm" onClick={openCreate} disabled={!loadingComponents && available.length === 0}>
                        <Plus className="mr-1.5 size-4" /> Assign
                    </Button>
                </PermissionGate>
            </div>

            <DataTable
                columns={columns}
                rows={rows}
                rowKey={(a) => a.id}
                loading={isLoading}
                error={!!error}
                onRetry={refetch}
                emptyText={
                    available.length === 0 && !loadingComponents
                        ? 'No earnings or deductions are switched on for your organisation yet. Switch them on in payroll settings first.'
                        : "Nothing assigned. Assign an allowance or deduction to include it in this employee's payroll."
                }
            />

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editing ? `Edit ${editing.title}` : 'Assign an earning or deduction'}
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={onSubmit} disabled={save.isPending || !canSave}>
                            {save.isPending ? 'Saving…' : 'Save'}
                        </Button>
                    </>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Component" required className="sm:col-span-2" htmlFor="pay-component">
                        <Combobox
                            id="pay-component"
                            value={form.component_id}
                            onChange={pickComponent}
                            options={options}
                            placeholder="Choose a switched-on component"
                            searchPlaceholder="Search components"
                            emptyText="No matching component is switched on"
                            disabled={!!editing}
                            loading={loadingComponents}
                        />
                    </Field>
                    {!isBenefit && (
                        <Field label="Calculated as">
                            <Select value={form.calculation} onChange={(e) => set('calculation', e.target.value as FormState['calculation'])}>
                                <option value="amount">Fixed monthly amount</option>
                                <option value="percentage">Percentage of pay</option>
                            </Select>
                        </Field>
                    )}
                    {form.calculation === 'percentage' && !isBenefit ? (
                        <>
                            <Field label="Percentage" required>
                                <Input type="number" step="0.01" min="0" max="100" value={form.percentage} onChange={(e) => set('percentage', e.target.value)} />
                            </Field>
                            <Field label="Of">
                                <Select value={form.percent_of} onChange={(e) => set('percent_of', e.target.value as FormState['percent_of'])}>
                                    <option value="basic">Basic pay</option>
                                    <option value="gross">Gross pay</option>
                                </Select>
                            </Field>
                        </>
                    ) : (
                        <Field label={isBenefit ? 'Monthly value' : 'Monthly amount'} required>
                            <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
                        </Field>
                    )}
                    <Field label={referenceLabel || 'Reference'} required={referenceRequired} help={referenceRequired ? 'Kept with the assignment so the deduction can be matched to the right account.' : 'Optional.'}>
                        <Input value={form.reference} onChange={(e) => set('reference', e.target.value)} />
                    </Field>
                    <Field label="From month" help="Leave blank to apply from the next payroll run.">
                        <Input type="month" value={form.start_month} onChange={(e) => set('start_month', e.target.value)} />
                    </Field>
                    <Field label="To month" help="Leave blank to keep it every month.">
                        <Input type="month" value={form.end_month} onChange={(e) => set('end_month', e.target.value)} />
                    </Field>
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} id="pay-component-active" />
                        <label htmlFor="pay-component-active" className="text-sm text-foreground">
                            Apply in payroll runs
                        </label>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                title={`Remove ${toDelete?.title ?? 'this assignment'}?`}
                description="Payroll stops applying it from the next run. Payslips already generated keep their lines."
                destructive
                loading={del.isPending}
                onCancel={() => setToDelete(null)}
                onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
            />
        </Card>
    );
}
