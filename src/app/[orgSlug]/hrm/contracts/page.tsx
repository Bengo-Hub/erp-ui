'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button, Card } from '@/components/ui/base';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { PayFields } from '@/components/hrm/pay-fields';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { IconButton } from '@/components/ui/tooltip';
import { useContracts, useDeleteContract, useSaveContract } from '@/hooks/use-contracts';
import { useEmployeeSalary, useSaveSalary } from '@/hooks/use-employees';
import { type EmployeeSalaryDetail } from '@/lib/api/employees';
import { normalizeSearchTerm, useDebouncedValue } from '@bengo-hub/shared-ui-lib/search';
import { useEmployeeOptions } from '@/hooks/use-employee-options';
import { normalizeList } from '@/lib/api/drf';
import { type Contract } from '@/lib/api/contracts';
import { formatCurrency } from '@/lib/format';
import { PAGE_SIZE, relationLabel } from '@/lib/hrm';

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'pending', label: 'Pending' }
];

const PAY_TYPES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'fixed', label: 'Fixed' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);

function statusVariant(s?: string) {
    const v = (s || '').toLowerCase();
    if (v === 'active') return 'success' as const;
    if (v === 'expired' || v === 'terminated') return 'error' as const;
    if (v === 'pending') return 'warning' as const;
    return 'secondary' as const;
}

type Form = {
    employee: string;
    contract_start_date: string;
    contract_end_date: string;
    /** Undefined until typed: a new contract then follows the payroll salary. */
    salary?: string;
    pay_type?: string;
    status: string;
    notes: string;
};

function toForm(c?: Contract): Form {
    const empId = c?.employee && typeof c.employee === 'object' ? c.employee.id : (c?.employee ?? '');
    return {
        employee: empId ? String(empId) : '',
        contract_start_date: c?.contract_start_date ?? '',
        contract_end_date: c?.contract_end_date ?? '',
        salary: c ? String(c.salary ?? '') : undefined,
        pay_type: c?.pay_type,
        status: c?.status ?? 'active',
        notes: c?.notes ?? ''
    };
}

export default function ContractsPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const debounced = useDebouncedValue(normalizeSearchTerm(search));

    const params = useMemo(() => ({ page, page_size: PAGE_SIZE, search: debounced || undefined, status: status || undefined }), [page, debounced, status]);
    const { data, isLoading, error, refetch } = useContracts(params);
    const { results: rows, count } = normalizeList<Contract>(data);
    const save = useSaveContract();
    const del = useDeleteContract();
    const { options: employeeOptions } = useEmployeeOptions();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Contract | null>(null);
    const [form, setForm] = useState<Form>(toForm());
    const [toDelete, setToDelete] = useState<Contract | null>(null);

    const open = (c?: Contract) => {
        setEditing(c ?? null);
        setForm(toForm(c));
        setUpdatePay(false);
        setDialogOpen(true);
    };

    // Payroll's salary is the single current pay. A new contract starts from it until the user
    // types another figure; an existing contract keeps the figure it states.
    const { data: salaryData } = useEmployeeSalary(dialogOpen && form.employee ? form.employee : undefined);
    const current = normalizeList<EmployeeSalaryDetail>(salaryData).results[0];
    const shown = {
        salary: form.salary ?? (editing || current?.basic_salary == null ? '' : String(current.basic_salary)),
        pay_type: form.pay_type ?? (PAY_TYPES.some((p) => p.value === current?.pay_frequency) ? String(current?.pay_frequency) : 'monthly')
    };
    const differs = !!form.employee && form.status === 'active' && Number(shown.salary) > 0 && Number(shown.salary) !== Number(current?.basic_salary ?? 0);
    const startsLater = form.contract_start_date > todayISO();
    const [updatePay, setUpdatePay] = useState(false);
    const savePay = useSaveSalary(form.employee);

    const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const submit = () => {
        if (!form.employee || !form.contract_start_date) return;
        const payload: Partial<Contract> = {
            // employee id is a UUID string — do not Number() it.
            employee: form.employee,
            contract_start_date: form.contract_start_date,
            contract_end_date: form.contract_end_date || undefined,
            salary: shown.salary || undefined,
            pay_type: shown.pay_type,
            status: form.status,
            // Sent as is, so clearing the notes clears them.
            notes: form.notes.trim()
        };
        save.mutate(
            { id: editing?.id, data: payload },
            {
                onSuccess: () => {
                    // Only the amount is sent: the API keeps reliefs, payment method and the rest.
                    if (differs && updatePay && !startsLater) savePay.mutate({ basic_salary: shown.salary });
                    setDialogOpen(false);
                }
            }
        );
    };

    const columns: Column<Contract>[] = [
        {
            header: 'Employee',
            cell: (c) => c.employee_name || (c.employee && typeof c.employee === 'object' ? c.employee.name : relationLabel(c.employee)) || '—'
        },
        { header: 'Start', cell: (c) => c.contract_start_date || '—' },
        { header: 'End', cell: (c) => c.contract_end_date || '—' },
        {
            header: 'Salary',
            className: 'text-right tabular-nums',
            headerClassName: 'text-right',
            cell: (c) => (
                <span>
                    {formatCurrency(c.salary)}
                    {c.salary_differs && <span className="block text-xs text-destructive">Payroll pays {formatCurrency(c.current_salary)}</span>}
                </span>
            )
        },
        { header: 'Pay Type', cell: (c) => <span className="capitalize">{c.pay_type || '—'}</span> },
        {
            header: 'Status',
            cell: (c) => (
                <span className="flex flex-wrap gap-1">
                    <Badge variant={statusVariant(c.status)}>{c.status || '—'}</Badge>
                    {c.is_current && <Badge variant="outline">Current</Badge>}
                </span>
            )
        },
        {
            header: '',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (c) => (
                <div className="flex justify-end gap-1">
                    <PermissionGate permission="change_employee">
                        <IconButton label="Edit contract" onClick={() => open(c)}>
                            <Pencil className="size-4" />
                        </IconButton>
                    </PermissionGate>
                    <PermissionGate permission="delete_employee">
                        <IconButton label="Delete contract" onClick={() => setToDelete(c)}>
                            <Trash2 className="size-4 text-destructive" />
                        </IconButton>
                    </PermissionGate>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="Contracts"
                subtitle="Employment contracts & terms"
                actions={
                    <PermissionGate permission="add_employee">
                        <Button size="sm" onClick={() => open()}>
                            <Plus className="mr-1.5 size-4" /> Add Contract
                        </Button>
                    </PermissionGate>
                }
            />

            <Card>
                <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                    <SearchInput
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        placeholder="Search employee, status…"
                        className="min-w-[220px] flex-1"
                    />
                    <Select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="w-auto min-w-[150px]"
                    >
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </Select>
                </div>

                <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} isLoading={isLoading} error={error} onRetry={refetch} emptyTitle="No contracts found" emptyDescription="Add a contract or adjust your filters." />
                {rows.length > 0 && (
                    <div className="border-t border-border">
                        <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
                    </div>
                )}
            </Card>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editing ? 'Edit contract' : 'Add contract'}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={submit} disabled={save.isPending}>
                            {save.isPending ? 'Saving…' : 'Save'}
                        </Button>
                    </>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Employee" htmlFor="c-emp" required className="sm:col-span-2">
                        <Select id="c-emp" value={form.employee} onChange={(e) => set('employee', e.target.value)}>
                            <option value="">Select employee…</option>
                            {employeeOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Start date" htmlFor="c-start" required>
                        <Input id="c-start" type="date" value={form.contract_start_date} onChange={(e) => set('contract_start_date', e.target.value)} />
                    </Field>
                    <Field label="End date" htmlFor="c-end">
                        <Input id="c-end" type="date" value={form.contract_end_date} onChange={(e) => set('contract_end_date', e.target.value)} />
                    </Field>
                    <PayFields
                        idPrefix="c"
                        amountLabel="Agreed salary"
                        amountHelp={current?.basic_salary != null ? `Payroll currently pays ${formatCurrency(current.basic_salary, current.currency ?? 'KES')}.` : form.employee ? 'No payroll salary is set for this employee yet.' : undefined}
                        value={{ amount: shown.salary, currency: current?.currency ?? 'KES', frequency: shown.pay_type }}
                        onChange={(p) => {
                            if (p.amount !== undefined) set('salary', p.amount);
                            if (p.frequency !== undefined) set('pay_type', p.frequency);
                        }}
                        frequencies={PAY_TYPES}
                        currencyReadOnly
                    />
                    <Field label="Status" htmlFor="c-status">
                        <Select id="c-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Notes" htmlFor="c-notes" className="sm:col-span-2">
                        <Textarea id="c-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. six months' probation, notice period" />
                    </Field>
                    {differs && (
                        <div className="rounded-lg border border-border bg-accent/5 p-3 text-sm sm:col-span-2">
                            {startsLater ? (
                                <p>This contract states a different salary from payroll. It starts on {form.contract_start_date}, so payroll keeps the current salary. Update the Salary tab when it starts.</p>
                            ) : (
                                <PermissionGate permission={['change_salarydetails', 'change_employee']} fallback={<p>This contract states a different salary from payroll.</p>}>
                                    <div className="flex items-start gap-2">
                                        <Switch checked={updatePay} onChange={setUpdatePay} id="c-update-pay" />
                                        <label htmlFor="c-update-pay">
                                            Also change the payroll salary to {formatCurrency(Number(shown.salary), current?.currency ?? 'KES')}. It applies to payroll runs from now on, including a re-run of an open month. Leave off to keep paying
                                            the current salary.
                                        </label>
                                    </div>
                                </PermissionGate>
                            )}
                        </div>
                    )}
                </div>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete contract?"
                description="This action cannot be undone."
                destructive
                loading={del.isPending}
                onCancel={() => setToDelete(null)}
                onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
            />
        </div>
    );
}
