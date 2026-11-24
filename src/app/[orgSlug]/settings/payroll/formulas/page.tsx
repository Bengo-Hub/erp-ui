'use client';

import { useParams, useRouter } from 'next/navigation';
import { Copy, Eye, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button, Card } from '@/components/ui/base';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { IconButton } from '@/components/ui/tooltip';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useCustomiseFormula, useDeleteFormula, useFormulas, useReliefs, useRevertFormula, useRevertRelief, useUpdateRelief } from '@/hooks/use-payroll-settings';
import { normalizeList } from '@/lib/api/drf';
import { type Formula, type Relief } from '@/lib/api/payroll-settings';
import { formatDate, formatMoney } from '@/lib/utils';

import { SourceBadge } from '../_source-badge';
import { usePayrollSettingsTabs } from '../_tabs';

const MANAGE = ['hrm.payroll.manage', 'change_payrollcomponents'];

/** Human name of a formula's (type, category), the key the payroll engine resolves. */
const KIND_LABEL: Record<string, string> = {
    'income:primary': 'PAYE (primary employee)',
    'income:secondary': 'PAYE (secondary employee)',
    'deduction:social_security_fund': 'NSSF',
    'deduction:shif': 'SHIF',
    'deduction:nhif': 'NHIF (legacy)',
    'deduction:housing_levy': 'Housing Levy',
    'deduction:nita': 'NITA'
};

const num = (v: unknown) => (v == null || v === '' ? 0 : Number(v) || 0);

/** KRA reliefs: platform reliefs every organisation inherits, switchable per organisation. */
function ReliefsCard() {
    const { data, isLoading, error, refetch } = useReliefs();
    const update = useUpdateRelief();
    const revert = useRevertRelief();
    const { hasAnyPermission } = useAppPermissions();
    const canManage = hasAnyPermission(MANAGE);
    const rows = (data?.results ?? []) as Relief[];

    const columns: Column<Relief>[] = [
        {
            header: 'Relief',
            cell: (r) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{r.title}</span>
                    {r.statutory && <Badge variant="default">Statutory</Badge>}
                </div>
            )
        },
        {
            header: 'Limit',
            className: 'text-right',
            headerClassName: 'text-right',
            cell: (r) => (r.actual_amount && num(r.percentage) > 0 ? `${num(r.percentage)}% up to ${formatMoney(r.fixed_limit)}` : formatMoney(r.fixed_limit))
        },
        { header: 'Source', cell: (r) => <SourceBadge source={r.source} platform={!!r.platform_id} /> },
        {
            header: 'Applies',
            cell: (r) => (
                <div className="flex items-center gap-2">
                    {canManage && <Switch checked={r.is_active} disabled={update.isPending} onChange={(next) => update.mutate({ relief_type: r.key, is_active: next })} />}
                    <span className="text-xs text-muted-foreground">{r.is_active ? 'On' : 'Off'}</span>
                </div>
            )
        },
        {
            header: '',
            className: 'text-right',
            cell: (r) =>
                r.source === 'tenant' && r.platform_id ? (
                    <PermissionGate permission={MANAGE}>
                        <IconButton label="Restore platform default" onClick={() => revert.mutate(r.key)} disabled={revert.isPending}>
                            <RotateCcw className="size-4" />
                        </IconButton>
                    </PermissionGate>
                ) : null
        }
    ];

    return (
        <Card>
            <div className="border-b border-border p-4">
                <h3 className="text-sm font-bold text-foreground">Tax Reliefs</h3>
                <p className="text-xs text-muted-foreground">KRA reliefs applied during payroll. Personal and insurance relief are on for every organisation by default.</p>
            </div>
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} isLoading={isLoading} error={error} onRetry={refetch} emptyTitle="No reliefs configured" />
        </Card>
    );
}

export default function FormulasPage() {
    const { tabs, active, onChange } = usePayrollSettingsTabs('formulas');
    const params = useParams<{ orgSlug: string }>();
    const router = useRouter();
    const { data, isLoading, error, refetch } = useFormulas({ limit: 200 });
    const customise = useCustomiseFormula();
    const revert = useRevertFormula();
    const del = useDeleteFormula();
    const { isPlatformOwner } = useAppPermissions();
    const rows = normalizeList<Formula>(data).results;

    const editHref = (id: string | number) => `/${params.orgSlug}/settings/payroll/formulas/${id}`;

    const columns: Column<Formula>[] = [
        {
            header: 'Name',
            cell: (f) => (
                <div>
                    <span className="font-medium">{f.name}</span>
                    <p className="text-xs text-muted-foreground">{KIND_LABEL[`${f.type}:${f.category}`] ?? `${f.type} / ${f.category}`}</p>
                </div>
            )
        },
        { header: 'Source', cell: (f) => <SourceBadge source={f.source} platform={!!f.overrides_id} /> },
        { header: 'Effective', cell: (f) => formatDate(f.effective_date) },
        {
            header: 'Status',
            cell: (f) => (f.is_current ? <Badge variant="success">Current</Badge> : <Badge variant="secondary">Historical</Badge>)
        },
        {
            header: '',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (f) => {
                const platformRow = f.source === 'platform';
                return (
                    <div className="flex items-center justify-end gap-1">
                        <IconButton label={platformRow && !isPlatformOwner ? 'View bands' : 'Edit bands'} onClick={() => router.push(editHref(f.id))}>
                            {platformRow && !isPlatformOwner ? <Eye className="size-4" /> : <SlidersHorizontal className="size-4" />}
                        </IconButton>
                        {platformRow && f.is_current && (
                            <PermissionGate permission={MANAGE}>
                                <IconButton label="Customise for my organisation" disabled={customise.isPending} onClick={() => customise.mutate(f.id, { onSuccess: (copy) => copy?.id && router.push(editHref(copy.id)) })}>
                                    <Copy className="size-4" />
                                </IconButton>
                            </PermissionGate>
                        )}
                        {!platformRow && f.overrides_id && (
                            <PermissionGate permission={MANAGE}>
                                <IconButton label="Restore platform default" disabled={revert.isPending} onClick={() => revert.mutate(f.id)}>
                                    <RotateCcw className="size-4" />
                                </IconButton>
                            </PermissionGate>
                        )}
                        {!platformRow && !f.overrides_id && (
                            <PermissionGate permission={MANAGE}>
                                <IconButton label="Delete formula" disabled={del.isPending} onClick={() => del.mutate(f.id)}>
                                    <Trash2 className="size-4 text-destructive" />
                                </IconButton>
                            </PermissionGate>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Payroll Settings" subtitle="Components, loans, formulas & statutory rates" />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
            <ReliefsCard />
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Formulas</h3>
                        <p className="text-xs text-muted-foreground">
                            Statutory rates are set once for every organisation. Customise a formula only when your organisation needs different rates; restoring brings back the platform version and its future updates.
                        </p>
                    </div>
                    <PermissionGate permission={['hrm.payroll.manage', 'add_payrollcomponents']}>
                        <Button size="sm" onClick={() => router.push(editHref('new'))}>
                            <SlidersHorizontal className="mr-1.5 size-4" /> New formula
                        </Button>
                    </PermissionGate>
                </div>
                <DataTable columns={columns} rows={rows} rowKey={(f) => String(f.id)} isLoading={isLoading} error={error} onRetry={refetch} emptyTitle="No formulas yet" />
            </Card>
        </div>
    );
}
