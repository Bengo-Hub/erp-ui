'use client';

import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { Badge } from '@/components/ui/base';
import { type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { useCostCenterCheck, useDeleteDepartment, useDepartments, useSaveDepartment } from '@/hooks/use-hrm-settings';
import { useCostCenterOptions } from '@/hooks/use-option-hooks';
import { normalizeList } from '@/lib/api/drf';
import { type Department } from '@/lib/api/hrm-settings';
import { useHrmSettingsTabs } from '../_tabs';

const fields: CrudFieldDef[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code' },
    {
        name: 'cost_center_id',
        label: 'Cost center (payroll not on a project)',
        type: 'combobox',
        optionsHook: useCostCenterOptions,
        placeholder: 'Select cost center'
    }
];

export default function DepartmentsPage() {
    const { tabs, active, onChange } = useHrmSettingsTabs('departments');
    const { data, isLoading, error, refetch } = useDepartments();
    const save = useSaveDepartment();
    const del = useDeleteDepartment();
    const rows = normalizeList<Department>(data).results;
    const { options: costCenters } = useCostCenterOptions();
    const costCenterName = (id?: string | null) => (id ? (costCenters.find((o) => o.value === id)?.label ?? id) : '—');
    const { data: check } = useCostCenterCheck();
    const problems = check?.problems ?? [];
    const problemOf = (d: Department) => problems.find((p) => p.record === 'department' && p.record_id === String(d.id));

    const columns: Column<Department>[] = [
        { header: 'Name', cell: (d) => <span className="font-medium">{d.name}</span> },
        { header: 'Code', cell: (d) => d.code || '—' },
        {
            header: 'Cost center',
            cell: (d) => {
                const p = problemOf(d);
                return (
                    <span className="inline-flex items-center gap-2">
                        {costCenterName(d.cost_center_id)}
                        {p ? <Badge variant="warning">{p.reason === 'inactive' ? 'Inactive in Treasury' : 'Not in Treasury'}</Badge> : null}
                    </span>
                );
            }
        },
        {
            header: 'Status',
            cell: (d) => <Badge variant={d.is_active === false ? 'secondary' : 'success'}>{d.is_active === false ? 'Inactive' : 'Active'}</Badge>
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Organization Structure" subtitle="Departments, job titles & job groups" />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
            {problems.length > 0 || check?.error ? (
                <div role="status" className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
                    <p className="font-medium text-foreground">Cost centres to fix</p>
                    {check?.error ? <p className="mt-1 text-muted-foreground">The last check could not reach Treasury, so the list below may be out of date.</p> : null}
                    {problems.length > 0 ? (
                        <>
                            <p className="mt-1 text-muted-foreground">These records point at a cost centre Treasury no longer has, or has switched off. Payroll cost for them is posted without a cost centre until you pick an active one.</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {problems.map((p) => (
                                    <li key={`${p.record}-${p.record_id}`}>
                                        {p.record === 'department' ? 'Department' : 'Project allocation'} {p.name || p.record_id}: {p.reason === 'inactive' ? 'cost centre switched off in Treasury' : 'cost centre not found in Treasury'}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : null}
                    {check?.checked_at ? <p className="mt-2 text-xs text-muted-foreground">Checked {new Date(check.checked_at).toLocaleString()}</p> : null}
                </div>
            ) : null}
            <CrudManager
                rows={rows}
                columns={columns}
                fields={fields}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                entityLabel="Department"
                perms={{ add: 'add_employee', change: 'change_employee', delete: 'delete_employee' }}
                toForm={(d) => ({
                    name: d?.name ?? '',
                    code: d?.code ?? '',
                    cost_center_id: d?.cost_center_id ?? ''
                })}
                onSave={({ id, data }, done) => save.mutate({ id, data }, { onSuccess: done })}
                onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
                saving={save.isPending}
                deleting={del.isPending}
            />
        </div>
    );
}
