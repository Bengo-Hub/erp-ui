'use client';

import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button, Card } from '@/components/ui/base';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { IconButton } from '@/components/ui/tooltip';
import { useOutletOptions } from '@/hooks/use-option-hooks';
import { useDeleteWorkSite, useWorkSites } from '@/hooks/use-work-sites';
import { type WorkSite } from '@/lib/api/work-sites';
import { formatDistance } from '@/lib/geo';

import { SiteFormDialog } from './_site-form-dialog';

/** Geo-fenced places where staff may clock in from their phones. */
export default function WorkSitesPage() {
    const { data, isLoading, error, refetch } = useWorkSites({ limit: 200 });
    const del = useDeleteWorkSite();
    const outlets = useOutletOptions();
    const [editing, setEditing] = useState<WorkSite | null | undefined>(undefined);
    const [removing, setRemoving] = useState<WorkSite | null>(null);
    const sites = data?.data ?? [];
    const outletName = useMemo(() => new Map(outlets.options.map((o) => [o.value, o.label])), [outlets.options]);

    const columns: Column<WorkSite>[] = [
        { header: 'Name', cell: (s) => <span className="font-medium">{s.name}</span> },
        {
            header: 'Branch',
            cell: (s) => (s.outlet_id ? (outletName.get(s.outlet_id) ?? (outlets.isLoading ? '…' : 'Unknown branch')) : <span className="text-muted-foreground">All branches</span>)
        },
        {
            header: 'Fence',
            cell: (s) => (s.ring && s.ring.length >= 3 ? `Outline, ${s.ring.length} corners` : `Circle, ${formatDistance(s.radius_m)} radius`)
        },
        {
            header: 'Location',
            cell: (s) => {
                const { lat, lng } = s.center;
                return (
                    <div>
                        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <MapPin className="size-3.5" /> Open map
                        </a>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                            {lat.toFixed(5)}, {lng.toFixed(5)}
                        </span>
                    </div>
                );
            }
        },
        { header: 'Status', cell: (s) => (s.active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Off</Badge>) },
        {
            header: '',
            className: 'text-right',
            cell: (s) => (
                <PermissionGate permission="hrm.attendance.manage">
                    <div className="flex justify-end gap-1">
                        <IconButton label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                            <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label={`Remove ${s.name}`} onClick={() => setRemoving(s)}>
                            <Trash2 className="size-4 text-destructive" />
                        </IconButton>
                    </div>
                </PermissionGate>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="Work sites"
                subtitle="Places staff may clock in from their phones. Attendance settings decide what happens outside them."
                actions={
                    <PermissionGate permission="hrm.attendance.manage">
                        <Button size="sm" onClick={() => setEditing(null)}>
                            <Plus className="mr-1.5 size-4" /> Add work site
                        </Button>
                    </PermissionGate>
                }
            />
            <Card>
                <DataTable
                    columns={columns}
                    rows={sites}
                    rowKey={(s) => s.id}
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                    ariaLabel="Work sites"
                    emptyTitle="No work sites yet"
                    emptyDescription="Add the office, factory or client sites where people clock in, and draw each one on the map."
                />
            </Card>
            {editing !== undefined && <SiteFormDialog key={editing?.id ?? 'new'} site={editing} sites={sites} onClose={() => setEditing(undefined)} />}
            <ConfirmDialog
                open={!!removing}
                title="Remove work site?"
                description="Clock-ins are no longer checked against this site. Records already made keep their site."
                confirmLabel="Remove work site"
                destructive
                loading={del.isPending}
                onCancel={() => setRemoving(null)}
                onConfirm={() => removing && del.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
            />
        </div>
    );
}
