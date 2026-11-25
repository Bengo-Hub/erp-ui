'use client';

import { DataTable, type DataTableColumn } from '@bengo-hub/shared-ui-lib/data-table';
import { useState } from 'react';

import { Badge, Card } from '@/components/ui/base';
import { Field, Input } from '@/components/ui/form';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useEmployeePaySummary } from '@/hooks/use-payroll';
import { type PaySummaryLine } from '@/lib/api/payroll';
import { formatCurrency } from '@/lib/format';

const KIND_LABELS: Record<string, string> = {
    earning: 'Earning',
    benefit: 'Benefit',
    deduction: 'Deduction',
    relief: 'Relief',
    employer: 'Employer cost',
    reimbursement: 'Reimbursement',
    not_deducted: 'Not deducted'
};

const ORIGIN_LABELS: Record<string, string> = { statutory: 'Statutory', automatic: 'Automatic', assigned: 'Assigned' };

const amount = (v?: string) => (v == null ? 'Not computed' : formatCurrency(v));

const columns: DataTableColumn<PaySummaryLine & { key: string }>[] = [
    { key: 'label', header: 'Item', primary: true, render: (l) => <span className="font-medium">{l.label}</span> },
    { key: 'kind', header: 'Type', accessor: (l) => KIND_LABELS[l.kind] ?? l.kind, render: (l) => KIND_LABELS[l.kind] ?? l.kind },
    {
        key: 'origin',
        header: 'Applies',
        render: (l) => (
            <span className="flex flex-wrap gap-1">
                <Badge variant={l.origin === 'assigned' ? 'default' : 'secondary'}>{ORIGIN_LABELS[l.origin] ?? l.origin}</Badge>
                {l.off && <Badge variant="warning">Off for your organisation</Badge>}
            </span>
        )
    },
    { key: 'employee', header: 'Employee', align: 'right', render: (l) => (l.kind === 'employer' || l.off ? '' : amount(l.employee_amount)) },
    { key: 'employer', header: 'Employer', align: 'right', render: (l) => (l.employer_amount != null ? formatCurrency(l.employer_amount) : '') }
];

/** Read-only: everything this month's payroll applies to the employee, from the payroll preview. */
export function PaySummary({ employeeId }: { employeeId: string }) {
    const [month, setMonth] = useState('');
    const { data, isLoading, error, refetch } = useEmployeePaySummary(employeeId, month || undefined);

    return (
        <Card>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground">What payroll applies</h3>
                    <p className="text-xs text-muted-foreground">Statutory items, salary, loans and assigned items for the month, as the payroll preview computes them.</p>
                </div>
                <Field label="Month" htmlFor="pay-summary-month">
                    <Input id="pay-summary-month" type="month" value={month || data?.period || ''} onChange={(e) => setMonth(e.target.value)} />
                </Field>
            </div>
            {isLoading ? (
                <LoadingState />
            ) : error || !data ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : (
                <>
                    {(data.reason || !!data.notes?.length) && (
                        <div className="space-y-1 border-b border-border p-4 text-sm">
                            {data.reason && <p className={data.state === 'not_computed' ? 'text-destructive' : undefined}>{data.reason}</p>}
                            {data.notes?.map((n) => (
                                <p key={n} className="text-muted-foreground">
                                    {n}
                                </p>
                            ))}
                        </div>
                    )}
                    <DataTable columns={columns} rows={data.lines.map((l, i) => ({ ...l, key: `${l.code}-${i}` }))} rowKey={(l) => l.key} emptyText="Nothing applies." />
                    {data.net_pay != null && (
                        <div className="flex flex-wrap justify-end gap-6 border-t border-border p-4 text-sm">
                            <span>
                                Gross <strong>{formatCurrency(data.gross_pay)}</strong>
                            </span>
                            <span>
                                Net pay <strong>{formatCurrency(data.net_pay)}</strong>
                            </span>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}
