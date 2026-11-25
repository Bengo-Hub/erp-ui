'use client';

import { PermissionGate } from '@/components/auth/permission-gate';
import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { Badge } from '@/components/ui/base';
import { type Column } from '@/components/ui/data-table';
import { Select } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { useDeleteLeaveCategory, useLeaveCategories, useSaveLeaveCategory, useSetLeaveBalanceRule, useSetLeaveCountMode } from '@/hooks/use-leave';
import { normalizeList } from '@/lib/api/drf';
import { type LeaveBalanceRule, type LeaveCategory, type LeaveCountMode } from '@/lib/api/leave';

const fields: CrudFieldDef[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'max_days', label: 'Max Days / Year', type: 'number', step: '0.5' },
    { name: 'is_paid', label: 'Paid Leave', type: 'switch' },
    { name: 'carry_forward', label: 'Allow Carry-Forward', type: 'switch' },
    { name: 'description', label: 'Description', type: 'textarea', span2: true }
];

export default function LeaveTypesPage() {
    const { data, isLoading, error, refetch } = useLeaveCategories();
    const save = useSaveLeaveCategory();
    const del = useDeleteLeaveCategory();
    const setMode = useSetLeaveCountMode();
    const setRule = useSetLeaveBalanceRule();
    const rows = normalizeList<LeaveCategory>(data).results;

    const columns: Column<LeaveCategory>[] = [
        {
            header: 'Name',
            cell: (c) => (
                <div>
                    <span className="font-medium">{c.name || '—'}</span>
                    {c.inherited ? <span className="block text-xs text-muted-foreground">Platform type, read-only</span> : null}
                </div>
            )
        },
        { header: 'Max Days', cell: (c) => c.max_days ?? c.days_allowed ?? c.default_annual_days ?? '—' },
        {
            header: 'Paid',
            cell: (c) => <Badge variant={c.is_paid ? 'success' : 'secondary'}>{c.is_paid ? 'Paid' : 'Unpaid'}</Badge>
        },
        {
            header: 'Carry-Forward',
            cell: (c) => ((c.carry_forward ?? c.allow_carryover) ? 'Yes' : 'No')
        },
        {
            header: 'Days counted',
            cell: (c) => (
                <PermissionGate permission="hrm.leave.manage" fallback={c.count_mode === 'calendar_days' ? 'Calendar days' : 'Working days'}>
                    <Select
                        aria-label={`How ${c.name ?? 'this type'} counts days`}
                        value={c.count_mode ?? 'working_days'}
                        disabled={setMode.isPending}
                        onChange={(e) => setMode.mutate({ id: c.id, mode: e.target.value as LeaveCountMode })}
                        className="w-auto min-w-[150px]"
                    >
                        <option value="working_days">Working days</option>
                        <option value="calendar_days">Calendar days</option>
                    </Select>
                </PermissionGate>
            )
        },
        {
            header: 'Beyond the balance',
            cell: (c) => (
                <PermissionGate permission="hrm.leave.manage" fallback={c.balance_rule === 'allow' ? 'Allow with a warning' : 'Refuse'}>
                    <Select
                        aria-label={`What ${c.name ?? 'this type'} does beyond the balance`}
                        value={c.balance_rule ?? 'refuse'}
                        disabled={setRule.isPending}
                        onChange={(e) => setRule.mutate({ id: c.id, rule: e.target.value as LeaveBalanceRule })}
                        className="w-auto min-w-[170px]"
                    >
                        <option value="refuse">Refuse</option>
                        <option value="allow">Allow with a warning</option>
                    </Select>
                </PermissionGate>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Leave Types" subtitle="Configure leave categories and their rules" />
            <CrudManager
                rows={rows}
                columns={columns}
                fields={fields}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                entityLabel="Leave Type"
                perms={{ add: 'add_leavecategory', change: 'change_leavecategory', delete: 'delete_leavecategory' }}
                // A platform type keeps its own values; only the two selects apply to it.
                canEdit={(c) => !c.inherited}
                canDelete={(c) => !c.inherited}
                emptyDescription="No leave types configured yet."
                toForm={(c) => ({
                    name: c?.name ?? '',
                    max_days: c?.max_days ?? c?.default_annual_days ?? '',
                    is_paid: c?.is_paid ?? true,
                    carry_forward: c?.carry_forward ?? c?.allow_carryover ?? false,
                    description: c?.description ?? ''
                })}
                onSave={({ id, data }, done) => save.mutate({ id, data: data as Partial<LeaveCategory> }, { onSuccess: done })}
                onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
                saving={save.isPending}
                deleting={del.isPending}
            />
        </div>
    );
}
