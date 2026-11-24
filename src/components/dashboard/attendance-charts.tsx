'use client';

import { ChartCard, GroupedBarChart, MultiLineChart, type SeriesDef } from '@/components/charts';
import { type AttendanceAnalytics } from '@/lib/api/attendance-analytics';
import { formatDate } from '@/lib/format';

// The same measure keeps the same colour on every chart and on the today strip.
const TREND_SERIES: SeriesDef[] = [
    { key: 'present', label: 'Present', color: 'var(--series-1)' },
    { key: 'late', label: 'Late', color: 'var(--series-2)' },
    { key: 'absent', label: 'Absent', color: 'hsl(var(--destructive))' }
];
const DEPT_SERIES: SeriesDef[] = [
    { key: 'late', label: 'Late', color: 'var(--series-2)' },
    { key: 'absent', label: 'Absent', color: 'hsl(var(--destructive))' }
];

const shortDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

/** The 30-day attendance trend and this month's late and absent counts by department. */
export function AttendanceCharts({ data }: { data: AttendanceAnalytics }) {
    const trend = data.trend_30d;
    // Departments with the most problems first; the top eight keep every label and bar readable.
    const depts = [...data.by_department].sort((a, b) => b.late + b.absent - (a.late + a.absent)).slice(0, 8);

    return (
        <div className="grid gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
                <ChartCard
                    title="Attendance, last 30 days"
                    subtitle="People present, late and absent each day"
                    empty={!trend.length}
                    emptyDescription="Daily figures appear once clock-ins are recorded."
                    table={{
                        columns: ['Date', 'Present', 'Late', 'Absent'],
                        rows: trend.map((p) => [formatDate(p.date), p.present, p.late, p.absent])
                    }}
                >
                    <MultiLineChart data={trend} xKey="date" series={TREND_SERIES} formatX={shortDay} />
                </ChartCard>
            </div>
            <div className="min-w-0 lg:col-span-2">
                <ChartCard
                    title="Late and absent by department"
                    subtitle="Departments with the most late and absent first"
                    empty={!depts.some((d) => d.late + d.absent > 0)}
                    emptyDescription="No lateness or absence recorded."
                    table={{
                        columns: ['Department', 'Present', 'Late', 'Absent'],
                        rows: data.by_department.map((d) => [d.department, d.present, d.late, d.absent])
                    }}
                >
                    <GroupedBarChart data={depts} categoryKey="department" series={DEPT_SERIES} />
                </ChartCard>
            </div>
        </div>
    );
}
