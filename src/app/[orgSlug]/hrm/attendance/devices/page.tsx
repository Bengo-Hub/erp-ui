'use client';

import { Pencil, Plus, TerminalSquare, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge, Button, Card } from '@/components/ui/base';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { IconButton } from '@/components/ui/tooltip';
import { useDeleteDevice, useDevices } from '@/hooks/use-attendance-devices';
import { useOutletOptions } from '@/hooks/use-option-hooks';
import { type AttendanceDevice } from '@/lib/api/attendance-devices';
import { timeAgo } from '@/lib/date-range';
import { formatNumber } from '@/lib/format';
import { PAGE_SIZE } from '@/lib/hrm';

import { DeviceCommandsDialog } from './_device-commands-dialog';
import { DeviceFormDialog } from './_device-form-dialog';

function OnlineBadge({ device }: { device: AttendanceDevice }) {
    if (!device.active) return <Badge variant="secondary">Disabled</Badge>;
    return device.online ? <Badge variant="success">Online</Badge> : <Badge variant="error">Offline</Badge>;
}

/** Biometric terminals that push punches and door events to the ERP, with their command queue. */
export default function DevicesPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, error, refetch } = useDevices({ page, limit: PAGE_SIZE });
    const del = useDeleteDevice();
    const outlets = useOutletOptions();
    const [editing, setEditing] = useState<AttendanceDevice | null | undefined>(undefined);
    const [commanding, setCommanding] = useState<AttendanceDevice | null>(null);
    const [removing, setRemoving] = useState<AttendanceDevice | null>(null);

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const outletName = useMemo(() => new Map(outlets.options.map((o) => [o.value, o.label])), [outlets.options]);
    const online = rows.filter((d) => d.active && d.online).length;

    const columns: Column<AttendanceDevice>[] = [
        {
            header: 'Device',
            cell: (d) => (
                <div className="min-w-0">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{d.serial}</p>
                </div>
            )
        },
        {
            // The device's own branch, else its work site's branch, else the site's name.
            header: 'Branch',
            cell: (d) => {
                const branchId = d.outlet_id || d.site_outlet_id;
                const branch = branchId ? (outletName.get(branchId) ?? (outlets.isLoading ? '…' : 'Unknown branch')) : null;
                if (branch) {
                    return (
                        <div>
                            <span>{branch}</span>
                            {d.work_site_name ? <span className="block text-xs text-muted-foreground">{d.work_site_name}</span> : null}
                        </div>
                    );
                }
                if (d.work_site_name) return d.work_site_name;
                return <span className="text-muted-foreground">All branches</span>;
            }
        },
        { header: 'Mode', cell: (d) => (d.mode === 'ac' ? 'Door access' : 'Attendance') },
        { header: 'Status', cell: (d) => <OnlineBadge device={d} /> },
        { header: 'Last seen', cell: (d) => timeAgo(d.last_seen_at) },
        { header: 'Users', className: 'text-right tabular-nums', headerClassName: 'text-right', cell: (d) => formatNumber(d.user_count ?? 0, 0) },
        {
            // Door-access devices send door events, not punches.
            header: 'Today',
            className: 'text-right tabular-nums',
            headerClassName: 'text-right',
            cell: (d) =>
                d.mode === 'ac' ? (
                    <span>
                        {formatNumber(d.event_count_today ?? 0, 0)} <span className="text-xs text-muted-foreground">door events</span>
                    </span>
                ) : (
                    <span>
                        {formatNumber(d.punch_count_today ?? 0, 0)} <span className="text-xs text-muted-foreground">punches</span>
                    </span>
                )
        },
        { header: 'Firmware', cell: (d) => <span className="text-xs text-muted-foreground">{d.firmware || '—'}</span> },
        {
            header: '',
            className: 'text-right',
            cell: (d) => (
                <div className="flex justify-end gap-1">
                    <IconButton label={`Commands for ${d.name}`} onClick={() => setCommanding(d)}>
                        <TerminalSquare className="size-4" />
                    </IconButton>
                    <IconButton label={`Edit ${d.name}`} onClick={() => setEditing(d)}>
                        <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label={`Remove ${d.name}`} onClick={() => setRemoving(d)}>
                        <Trash2 className="size-4 text-destructive" />
                    </IconButton>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="Devices"
                subtitle={total && total <= PAGE_SIZE ? `${online} of ${total} online` : 'Biometric terminals that send punches and door events to the ERP'}
                actions={
                    <PermissionGate permission="hrm.attendance.manage">
                        <Button size="sm" onClick={() => setEditing(null)}>
                            <Plus className="mr-1.5 size-4" /> Register device
                        </Button>
                    </PermissionGate>
                }
            />
            <Card>
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey={(d) => d.id}
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                    ariaLabel="Devices"
                    emptyTitle="No devices registered"
                    emptyDescription="Set the terminal's cloud server to this ERP's address, then register it here by its serial number."
                />
                {total > PAGE_SIZE && (
                    <div className="border-t border-border p-3">
                        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
                    </div>
                )}
            </Card>

            {editing !== undefined && <DeviceFormDialog key={editing?.id ?? 'new'} open device={editing} onClose={() => setEditing(undefined)} />}
            <DeviceCommandsDialog device={commanding} onClose={() => setCommanding(null)} />
            <ConfirmDialog
                open={!!removing}
                title="Remove device?"
                description="The device stops being accepted and its later pushes are rejected. Punches already received stay."
                confirmLabel="Remove device"
                destructive
                loading={del.isPending}
                onCancel={() => setRemoving(null)}
                onConfirm={() => removing && del.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
            />
        </div>
    );
}
