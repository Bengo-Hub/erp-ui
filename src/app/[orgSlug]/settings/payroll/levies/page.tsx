'use client';

import { useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button } from '@/components/ui/base';
import { type Column, DataTable } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Switch } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { useCancelLevyRule, useEarnings, useLevyBases, useSetLevyRule } from '@/hooks/use-payroll-settings';
import { normalizeList } from '@/lib/api/drf';
import { type LevyFlags, type LevyRule, type PayrollComponent } from '@/lib/api/payroll-settings';

import { usePayrollSettingsTabs } from '../_tabs';

// Which levies each earning counts for (PAYE, NSSF, SHIF, Housing Levy) and whether it is
// pensionable (the pension relief limit is 30% of pensionable pay). Rules are dated: a change
// applies from the month chosen, and months already paid keep theirs.

const thisMonth = () => new Date().toISOString().slice(0, 7);

const LEVIES: { key: keyof LevyFlags; label: string }[] = [
    { key: 'paye', label: 'PAYE' },
    { key: 'nssf', label: 'NSSF' },
    { key: 'shif', label: 'SHIF' },
    { key: 'housing_levy', label: 'Housing Levy' },
    { key: 'pensionable', label: 'Pensionable' }
];

type Row = { code: string; title: string; taxable: boolean };

/** Treatment of an earning without a rule: what payroll has always done. */
const defaultFlags = (r: Row): LevyFlags => ({
    paye: r.taxable,
    nssf: r.taxable,
    shif: r.taxable,
    housing_levy: r.taxable,
    pensionable: r.code === 'basic'
});

/** The rule in force for a month, if any. */
const ruleFor = (rules: LevyRule[] | undefined, month: string) => (rules ?? []).filter((r) => r.from <= month).sort((a, b) => b.from.localeCompare(a.from))[0];

export default function LevyBasesPage() {
    const { tabs, active, onChange } = usePayrollSettingsTabs('levies');
    const earnings = useEarnings({ limit: 200 });
    const bases = useLevyBases();
    const save = useSetLevyRule();
    const cancel = useCancelLevyRule();
    const [editing, setEditing] = useState<{ row: Row; from: string; flags: LevyFlags } | null>(null);

    const month = thisMonth();
    const rows: Row[] = normalizeList<PayrollComponent>(earnings.data as PayrollComponent[] | undefined)
        .results.filter((c) => c.code)
        .map((c) => ({ code: c.code as string, title: c.name ?? (c.code as string), taxable: c.taxable_status !== 'nontaxable' && c.is_taxable !== false }));
    if (!rows.some((r) => r.code === 'basic')) rows.unshift({ code: 'basic', title: 'Basic Pay', taxable: true });

    const own = bases.data?.own ?? {};
    const platform = bases.data?.platform ?? {};
    const inForce = (r: Row): { flags: LevyFlags; source: string } => {
        const o = ruleFor(own[r.code], month);
        if (o) return { flags: o.flags, source: 'Your rule' };
        const p = ruleFor(platform[r.code], month);
        if (p) return { flags: p.flags, source: 'Platform' };
        return { flags: defaultFlags(r), source: 'Default' };
    };
    const upcoming = (r: Row) => [...(own[r.code] ?? []), ...(platform[r.code] ?? [])].filter((x) => x.from > month).sort((a, b) => a.from.localeCompare(b.from))[0];

    const columns: Column<Row>[] = [
        { header: 'Earning', cell: (r) => <span className="font-medium">{r.title}</span> },
        ...LEVIES.map((l) => ({
            header: l.label,
            cell: (r: Row) => (inForce(r).flags[l.key] ? <Badge variant="success">Yes</Badge> : <Badge variant="secondary">No</Badge>)
        })),
        {
            header: 'Source',
            cell: (r) => {
                const next = upcoming(r);
                // Your own rules that start in a later month can be cancelled.
                const ownFuture = (own[r.code] ?? []).filter((x) => x.from > month);
                return (
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                            {inForce(r).source}
                            {next ? `, changes from ${next.from}` : ''}
                        </span>
                        {ownFuture.map((x) => (
                            <PermissionGate key={x.from} permission={['hrm.payroll.manage']}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={cancel.isPending}
                                    onClick={() => {
                                        if (window.confirm(`Cancel the ${r.title} rule from ${x.from}?`)) cancel.mutate({ code: r.code, from: x.from });
                                    }}
                                >
                                    Cancel {x.from}
                                </Button>
                            </PermissionGate>
                        ))}
                    </span>
                );
            }
        },
        {
            header: '',
            cell: (r) => (
                <PermissionGate permission={['hrm.payroll.manage', 'change_payrollcomponents']}>
                    <Button variant="outline" size="sm" onClick={() => setEditing({ row: r, from: month, flags: { ...inForce(r).flags } })}>
                        Change
                    </Button>
                </PermissionGate>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
            <p className="text-sm text-muted-foreground">
                Which levies each earning counts for this month, and whether it is pensionable. The pension contribution an employee can deduct before tax is capped at 30% of pensionable pay. Without a rule, a taxable earning counts for every levy, a
                tax-free one for none, and only basic pay is pensionable.
            </p>
            <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r.code}
                isLoading={earnings.isLoading || bases.isLoading}
                error={earnings.error ?? bases.error}
                onRetry={() => {
                    earnings.refetch();
                    bases.refetch();
                }}
                ariaLabel="Levy bases"
            />
            <Dialog
                open={!!editing}
                onClose={() => setEditing(null)}
                title={editing ? `Levies for ${editing.row.title}` : ''}
                description="The change applies from the month you choose. Months already paid keep what applied to them."
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button disabled={save.isPending || !editing?.from} onClick={() => editing && save.mutate({ code: editing.row.code, rule: { from: editing.from, flags: editing.flags } }, { onSuccess: () => setEditing(null) })}>
                            {save.isPending ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                }
            >
                {editing ? (
                    <div className="space-y-4">
                        <Field label="Applies from">
                            <Input type="month" min={month} value={editing.from} onChange={(e) => setEditing({ ...editing, from: e.target.value })} />
                        </Field>
                        {LEVIES.map((l) => (
                            <div key={l.key} className="flex items-center justify-between gap-4 text-sm">
                                <span>{l.key === 'pensionable' ? 'Pensionable' : `Counts for ${l.label}`}</span>
                                <Switch checked={editing.flags[l.key]} onChange={(v) => setEditing({ ...editing, flags: { ...editing.flags, [l.key]: v } })} />
                            </div>
                        ))}
                    </div>
                ) : null}
            </Dialog>
        </div>
    );
}
