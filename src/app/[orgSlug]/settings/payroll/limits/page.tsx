'use client';

import { useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button } from '@/components/ui/base';
import { Field, Input, Switch } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { useDeductionLimits, useDeductions, useSetDeductionLimits } from '@/hooks/use-payroll-settings';
import { normalizeList } from '@/lib/api/drf';
import { type DeductionLimitsDoc, type PayrollComponent } from '@/lib/api/payroll-settings';

import { usePayrollSettingsTabs } from '../_tabs';

// Employment Act (Cap. 226) s.19: all deductions together at most a share of wages (two-thirds by
// default) and an employer loan repayment at most a share of what is left (one half). Deductions
// another law requires are always taken in full. A field the organisation leaves empty follows
// the platform default.

/** "2/3" or "0.6667" as a percentage for display. */
const asPercent = (share: string | undefined) => {
    if (!share) return '';
    const [n, d] = share.split('/');
    const v = d ? Number(n) / Number(d) : Number(share);
    return Number.isFinite(v) ? `${(v * 100).toFixed(2).replace(/\.00$/, '')}%` : share;
};

export default function DeductionLimitsPage() {
    const { tabs, active, onChange } = usePayrollSettingsTabs('limits');
    const limits = useDeductionLimits();
    const deductions = useDeductions({ limit: 200 });
    const save = useSetDeductionLimits();
    // Only what the user has edited; anything untouched shows the organisation's saved value.
    const [edits, setEdits] = useState<{ maxShare?: string; loanShare?: string; byLaw?: string[] }>({});

    const own = limits.data?.own;
    const effective = limits.data?.effective;
    const maxShare = edits.maxShare ?? own?.max_share ?? '';
    const loanShare = edits.loanShare ?? own?.loan_share ?? '';
    const byLaw = edits.byLaw ?? own?.by_law ?? null;
    const setMaxShare = (v: string) => setEdits((e) => ({ ...e, maxShare: v }));
    const setLoanShare = (v: string) => setEdits((e) => ({ ...e, loanShare: v }));
    const setByLaw = (v: string[]) => setEdits((e) => ({ ...e, byLaw: v }));

    // Opt-in deductions a company could mark as required by law; statutory ones always are.
    const optIn = normalizeList<PayrollComponent>(deductions.data as PayrollComponent[] | undefined).results.filter(
        (c) => c.code && !['paye', 'nssf', 'shif', 'housing_levy', 'nita', 'loans', 'advances', 'loss_damages', 'staff_purchase'].includes(c.code)
    );
    const listInForce = byLaw ?? effective?.by_law ?? [];
    const toggle = (code: string, on: boolean) => {
        const next = new Set(listInForce);
        if (on) next.add(code);
        else next.delete(code);
        setByLaw([...next]);
    };

    const submit = () => {
        const doc: DeductionLimitsDoc = {};
        if (maxShare.trim()) doc.max_share = maxShare.trim();
        if (loanShare.trim()) doc.loan_share = loanShare.trim();
        if (byLaw) doc.by_law = byLaw;
        save.mutate(doc, { onSuccess: () => setEdits({}) });
    };

    const source = (field: keyof DeductionLimitsDoc) => (own?.[field] !== undefined ? <Badge variant="default">Your setting</Badge> : <Badge variant="secondary">Platform default</Badge>);

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
            <p className="text-sm text-muted-foreground">
                The Employment Act (Cap. 226) s.19 limits what may be deducted from wages. Statutory deductions and those another law requires come first and are always taken in full. Then the other deductions, then losses, staff purchases,
                advances and loans, within the limits below. What the limits leave unrecovered stays on the balance and shows on the payslip as deferred.
            </p>
            {limits.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
            ) : limits.error ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    Could not load the deduction limits.
                    <Button variant="outline" size="sm" onClick={() => limits.refetch()}>
                        Retry
                    </Button>
                </div>
            ) : (
                <div className="max-w-2xl space-y-6 rounded-xl border border-border p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="All deductions, at most this share of wages" help={`In force: ${asPercent(effective?.max_share)}. A decimal (0.6667) or a ratio (2/3); empty follows the platform.`}>
                            <div className="flex items-center gap-2">
                                <Input value={maxShare} placeholder={limits.data?.platform.max_share ?? '2/3'} onChange={(e) => setMaxShare(e.target.value)} />
                                {source('max_share')}
                            </div>
                        </Field>
                        <Field label="Employer loan, at most this share of what is left" help={`In force: ${asPercent(effective?.loan_share)}. Empty follows the platform.`}>
                            <div className="flex items-center gap-2">
                                <Input value={loanShare} placeholder={limits.data?.platform.loan_share ?? '1/2'} onChange={(e) => setLoanShare(e.target.value)} />
                                {source('loan_share')}
                            </div>
                        </Field>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">Always taken in full (required by law)</span>
                            {source('by_law')}
                        </div>
                        {optIn.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No opt-in deductions are set up.</p>
                        ) : (
                            optIn.map((c) => (
                                <div key={c.code} className="flex items-center justify-between gap-4 text-sm">
                                    <span>{c.name ?? c.code}</span>
                                    <Switch checked={listInForce.includes(c.code as string)} onChange={(v) => toggle(c.code as string, v)} />
                                </div>
                            ))
                        )}
                    </div>
                    <PermissionGate permission={['hrm.payroll.manage']}>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={save.isPending}
                                onClick={() => {
                                    if (window.confirm('Use the platform defaults for every deduction limit?')) save.mutate({}, { onSuccess: () => setEdits({}) });
                                }}
                            >
                                Use platform defaults
                            </Button>
                            <Button disabled={save.isPending} onClick={submit}>
                                {save.isPending ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    </PermissionGate>
                </div>
            )}
        </div>
    );
}
