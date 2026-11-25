'use client';

import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { useDeleteJobGroup, useJobGroups, useSaveJobGroup } from '@/hooks/use-hrm-settings';
import { normalizeList } from '@/lib/api/drf';
import { type JobGroup } from '@/lib/api/hrm-settings';
import { useHrmSettingsTabs } from '../_tabs';

const fields: CrudFieldDef[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description', type: 'textarea', span2: true }
];

export default function JobGroupsPage() {
    const { tabs, active, onChange } = useHrmSettingsTabs('job-groups');
    const { data, isLoading, error, refetch } = useJobGroups();
    const save = useSaveJobGroup();
    const del = useDeleteJobGroup();
    const rows = normalizeList<JobGroup>(data).results;

    const columns: Column<JobGroup>[] = [
        { header: 'Name', cell: (g) => <span className="font-medium">{g.name}</span> },
        { header: 'Description', cell: (g) => g.description || '—' }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Organization Structure" subtitle="Departments, job titles & job groups" />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
            <CrudManager
                rows={rows}
                columns={columns}
                fields={fields}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                entityLabel="Job Group"
                perms={{ add: 'add_employee', change: 'change_employee', delete: 'delete_employee' }}
                toForm={(g) => ({
                    name: g?.name ?? '',
                    description: g?.description ?? ''
                })}
                onSave={({ id, data }, done) => save.mutate({ id, data }, { onSuccess: done })}
                onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
                saving={save.isPending}
                deleting={del.isPending}
            />
        </div>
    );
}
