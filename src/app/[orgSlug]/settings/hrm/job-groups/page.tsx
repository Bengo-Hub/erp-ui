'use client';

import { RotateCcw } from 'lucide-react';
import { PermissionGate } from '@/components/auth/permission-gate';
import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { InheritedBadge } from '@/components/settings/inherited-badge';
import { type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { IconButton } from '@/components/ui/tooltip';
import { useDeleteJobGroup, useJobGroups, useRevertJobGroup, useSaveJobGroup } from '@/hooks/use-hrm-settings';
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
    const revert = useRevertJobGroup();
    const rows = normalizeList<JobGroup>(data).results;

    const columns: Column<JobGroup>[] = [
        {
            header: 'Name',
            cell: (g) => (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{g.name}</span>
                    <InheritedBadge inherited={g.inherited} customised={g.customised} />
                </div>
            )
        },
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
                // A platform job group keeps its name; its description can be customised here.
                canDelete={(g) => !g.inherited}
                editTitle={(g) => (g.inherited ? `Customise ${g.name}` : 'Edit Job Group')}
                rowActions={(g) =>
                    g.customised ? (
                        <PermissionGate permission="change_employee">
                            <IconButton label="Restore platform values" onClick={() => revert.mutate(g.id)} disabled={revert.isPending}>
                                <RotateCcw className="size-4" />
                            </IconButton>
                        </PermissionGate>
                    ) : null
                }
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
