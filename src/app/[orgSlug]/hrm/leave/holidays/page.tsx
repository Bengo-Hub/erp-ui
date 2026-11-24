'use client';

import { useState } from 'react';

import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { type Column } from '@/components/ui/data-table';
import { Select } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { useDeletePublicHoliday, usePublicHolidays, useSavePublicHoliday } from '@/hooks/use-leave';
import { normalizeList } from '@/lib/api/drf';
import { type PublicHoliday } from '@/lib/api/leave';
import { PAGE_SIZE } from '@/lib/hrm';
import { formatDate } from '@/lib/utils';

const fields: CrudFieldDef[] = [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Mashujaa Day' },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'is_national', label: 'National holiday', type: 'switch' },
    {
        name: 'county',
        label: 'County',
        required: true,
        placeholder: 'e.g. Mombasa',
        showIf: (v) => !v.is_national
    }
];

/** Dates arrive as RFC 3339; the date input wants YYYY-MM-DD. */
const dateOnly = (v?: string) => (v ? v.slice(0, 10) : '');

const thisYear = new Date().getFullYear();
const YEARS = [thisYear - 1, thisYear, thisYear + 1];

export default function PublicHolidaysPage() {
    const [year, setYear] = useState(String(thisYear));
    const [page, setPage] = useState(1);
    const { data, isLoading, error, refetch } = usePublicHolidays({ page, page_size: PAGE_SIZE, ...(year ? { year } : {}) });
    const save = useSavePublicHoliday();
    const del = useDeletePublicHoliday();
    const { results: rows, count } = normalizeList<PublicHoliday>(data);

    const columns: Column<PublicHoliday>[] = [
        { header: 'Name', cell: (h) => <span className="font-medium">{h.name}</span> },
        { header: 'Date', cell: (h) => formatDate(h.date) },
        { header: 'Applies to', cell: (h) => (h.is_national ? 'Everyone (national)' : `${h.county || '—'} county`) }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader
                title="Public Holidays"
                subtitle="Holidays on your calendar. Attendance does not mark anyone absent on them, hours worked on them earn the holiday rate, and they come off working capacity in project planning."
                actions={
                    <Select
                        aria-label="Year"
                        value={year}
                        onChange={(e) => {
                            setYear(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All years</option>
                        {YEARS.map((y) => (
                            <option key={y} value={String(y)}>
                                {y}
                            </option>
                        ))}
                    </Select>
                }
            />
            <CrudManager
                rows={rows}
                columns={columns}
                fields={fields}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                entityLabel="Public Holiday"
                perms={{ add: 'add_publicholiday', change: 'change_publicholiday', delete: 'delete_publicholiday' }}
                emptyDescription="No public holidays for this period yet."
                toForm={(h) => ({
                    name: h?.name ?? '',
                    date: dateOnly(h?.date),
                    is_national: h ? Boolean(h.is_national) : true,
                    county: h?.county ?? ''
                })}
                onSave={({ id, data }, done) => {
                    const national = Boolean(data.is_national);
                    save.mutate(
                        {
                            id,
                            data: {
                                name: String(data.name ?? '').trim(),
                                date: String(data.date ?? ''),
                                is_national: national,
                                county: national ? '' : String(data.county ?? '').trim()
                            }
                        },
                        { onSuccess: done }
                    );
                }}
                onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
                saving={save.isPending}
                deleting={del.isPending}
                pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
            />
        </div>
    );
}
