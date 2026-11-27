'use client';

import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { LeaveFormDialog } from '@/app/[orgSlug]/hrm/leave/requests/_leave-form-dialog';
import { StatusBadge } from '@/components/hrm/status-badge';
import { Button, Card } from '@/components/ui/base';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { IconButton } from '@/components/ui/tooltip';
import { useCancelLeave, useLeaveBalances, useLeaveRequests } from '@/hooks/use-leave';
import { normalizeList } from '@/lib/api/drf';
import { type LeaveBalance, type LeaveRequest } from '@/lib/api/leave';
import { PAGE_SIZE } from '@/lib/hrm';
import { formatDate } from '@/lib/utils';

/** Self-service leave: the signed-in person's own requests and balances. Needs no HR permission. */
export default function MyLeavePage() {
    const [applyOpen, setApplyOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [toCancel, setToCancel] = useState<LeaveRequest | null>(null);
    const [toEdit, setToEdit] = useState<LeaveRequest | null>(null);
    const requests = useLeaveRequests({ mine: true, page, page_size: PAGE_SIZE });
    const year = new Date().getFullYear();
    const balances = useLeaveBalances({ mine: true, year, limit: 100 });
    const cancel = useCancelLeave();
    const { results: rows, count } = normalizeList<LeaveRequest>(requests.data);
    const balanceRows = normalizeList<LeaveBalance>(balances.data).results;

    const columns: Column<LeaveRequest>[] = [
        { header: 'Type', cell: (r) => <span className="font-medium">{r.leave_category_name || '—'}</span> },
        { header: 'From', cell: (r) => formatDate(r.start_date) },
        { header: 'To', cell: (r) => formatDate(r.end_date) },
        { header: 'Days', cell: (r) => r.days ?? '—' },
        { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
        { header: 'Note', cell: (r) => r.rejection_reason || r.reason || '—' },
        {
            header: '',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (r) =>
                r.status === 'pending' ? (
                    <div className="flex justify-end gap-1">
                        <IconButton label="Edit request" onClick={() => setToEdit(r)}>
                            <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label="Cancel request" onClick={() => setToCancel(r)}>
                            <X className="size-4 text-destructive" />
                        </IconButton>
                    </div>
                ) : null
        }
    ];

    const balanceColumns: Column<LeaveBalance>[] = [
        { header: 'Leave type', cell: (b) => <span className="font-medium">{b.leave_type_name || '—'}</span> },
        { header: 'Entitled', cell: (b) => b.entitled ?? '—' },
        { header: 'Used', cell: (b) => b.used ?? '—' },
        { header: 'Remaining', cell: (b) => b.remaining ?? '—' }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="My Leave"
                subtitle="Your leave requests and balances"
                actions={
                    <Button size="sm" onClick={() => setApplyOpen(true)}>
                        <Plus className="mr-1.5 size-4" /> Apply for Leave
                    </Button>
                }
            />
            <Card>
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey={(r) => r.id}
                    isLoading={requests.isLoading}
                    error={requests.error}
                    onRetry={requests.refetch}
                    emptyTitle="No leave requests"
                    emptyDescription="Your requests appear here once you apply."
                />
                {count > PAGE_SIZE ? (
                    <div className="border-t border-border">
                        <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
                    </div>
                ) : null}
            </Card>
            <Card>
                <h3 className="border-b border-border p-4 text-sm font-bold text-foreground">{year} balances</h3>
                <DataTable
                    columns={balanceColumns}
                    rows={balanceRows}
                    rowKey={(b) => b.id}
                    isLoading={balances.isLoading}
                    error={balances.error}
                    onRetry={balances.refetch}
                    emptyTitle="No balances"
                    emptyDescription="Your balances appear here once HR sets them up."
                />
            </Card>
            <LeaveFormDialog self open={applyOpen} onClose={() => setApplyOpen(false)} />
            <LeaveFormDialog self open={!!toEdit} request={toEdit} onClose={() => setToEdit(null)} />
            <ConfirmDialog
                open={!!toCancel}
                title="Cancel this leave request?"
                description="It is withdrawn from your approvers. You can apply again for the same dates."
                confirmLabel="Cancel request"
                cancelLabel="Keep it"
                destructive
                loading={cancel.isPending}
                onCancel={() => setToCancel(null)}
                onConfirm={() => toCancel && cancel.mutate(toCancel.id, { onSettled: () => setToCancel(null) })}
            />
        </div>
    );
}
