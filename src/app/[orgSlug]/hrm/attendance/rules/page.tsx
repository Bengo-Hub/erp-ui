'use client';

import { useState } from 'react';

import { CrudManager, type CrudFieldDef } from '@/components/crud/crud-manager';
import { Badge } from '@/components/ui/base';
import { type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useAttendanceRules, useDeleteAttendanceRule, useSaveAttendanceRule } from '@/hooks/use-attendance';
import { normalizeList } from '@/lib/api/drf';
import { RULE_TYPES, type AttendanceRule, type AttendanceRuleType } from '@/lib/api/attendance';
import { PAGE_SIZE } from '@/lib/hrm';

const LATE_PENALTIES = [
    { value: 'warning', label: 'Warning only (no deduction)' },
    { value: 'fixed', label: 'Fixed amount per late arrival' },
    { value: 'percent_daily', label: 'Percent of daily pay per late arrival' },
    { value: 'per_minute', label: 'Deduct the minutes late' }
];

const ABSENCE_ACTIONS = [
    { value: 'warning', label: 'Warning only (no deduction)' },
    { value: 'deduct', label: 'Deduct the absent days' }
];

const is =
    (...types: AttendanceRuleType[]) =>
    (v: Record<string, unknown>) =>
        types.includes(v.rule_type as AttendanceRuleType);

const fields: CrudFieldDef[] = [
    { name: 'name', label: 'Rule Name', required: true, placeholder: 'e.g. Standard lateness' },
    { name: 'rule_type', label: 'Type', type: 'select', required: true, options: RULE_TYPES },
    { name: 'late_threshold_minutes', label: 'Grace period (minutes)', type: 'number', showIf: is('late_policy') },
    { name: 'late_penalty_type', label: 'Penalty', type: 'select', options: LATE_PENALTIES, showIf: is('late_policy') },
    { name: 'late_penalty_value', label: 'Penalty value', type: 'number', step: '0.01', showIf: is('late_policy') },
    { name: 'overtime_threshold_hours', label: 'Overtime starts after (hours)', type: 'number', step: '0.25', showIf: is('overtime_policy') },
    { name: 'overtime_rate_multiplier', label: 'Overtime rate (times hourly pay)', type: 'number', step: '0.05', showIf: is('overtime_policy') },
    { name: 'max_overtime_hours', label: 'Max overtime per day (hours)', type: 'number', step: '0.25', showIf: is('overtime_policy') },
    { name: 'consecutive_absent_threshold', label: 'Absences in a row', type: 'number', showIf: is('absenteeism_policy') },
    { name: 'monthly_absent_threshold', label: 'Absences per month', type: 'number', showIf: is('absenteeism_policy') },
    { name: 'absenteeism_action', label: 'Action', type: 'select', options: ABSENCE_ACTIONS, showIf: is('absenteeism_policy') },
    { name: 'standard_work_hours', label: 'Standard day (hours)', type: 'number', step: '0.25', showIf: is('work_hours_policy') },
    { name: 'min_work_hours', label: 'Minimum day (hours)', type: 'number', step: '0.25', showIf: is('work_hours_policy') },
    { name: 'max_work_hours', label: 'Maximum day (hours)', type: 'number', step: '0.25', showIf: is('work_hours_policy') },
    { name: 'break_duration_minutes', label: 'Break length (minutes)', type: 'number', showIf: is('break_policy') },
    { name: 'holiday_pay_multiplier', label: 'Holiday rate (times hourly pay)', type: 'number', step: '0.05', showIf: is('holiday_policy') },
    { name: 'priority', label: 'Priority', type: 'number', placeholder: '100 (higher applies first)' },
    { name: 'is_active', label: 'Active', type: 'switch' },
    { name: 'description', label: 'Description', type: 'textarea', span2: true }
];

const typeLabel = (t?: string) => RULE_TYPES.find((r) => r.value === t)?.label ?? '—';

/** Trim a decimal string ("1.50" -> "1.5"). */
const num = (v?: string | number | null) => (v == null || v === '' ? '' : String(Number(v)));

/** The value that matters for the rule's type, in words. */
function ruleSummary(r: AttendanceRule): string {
    switch (r.rule_type) {
        case 'late_policy': {
            const grace = `${r.late_threshold_minutes ?? 0} min grace`;
            const penalty = LATE_PENALTIES.find((p) => p.value === r.late_penalty_type);
            return !r.late_penalty_type || r.late_penalty_type === 'warning' ? `${grace}, warning` : `${grace}, ${penalty?.label.toLowerCase() ?? r.late_penalty_type}`;
        }
        case 'overtime_policy':
            return `after ${num(r.overtime_threshold_hours)} h at ${num(r.overtime_rate_multiplier)}x`;
        case 'absenteeism_policy':
            return `${r.consecutive_absent_threshold ?? '?'} in a row or ${r.monthly_absent_threshold ?? '?'} a month`;
        case 'work_hours_policy':
            return `${num(r.standard_work_hours)} h day (${num(r.min_work_hours)}–${num(r.max_work_hours)} h)`;
        case 'break_policy':
            return `${r.break_duration_minutes ?? '?'} min break`;
        case 'holiday_policy':
            return `${num(r.holiday_pay_multiplier)}x on holidays`;
        default:
            return '—';
    }
}

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const int = (v: unknown) => (str(v) === '' ? undefined : Math.trunc(Number(v)));

/** Form values to the erp-api rule body: ints as numbers, decimals as strings, blanks omitted. */
function toBody(v: Record<string, unknown>): Partial<AttendanceRule> {
    const dec = (k: string) => str(v[k]) || undefined;
    return {
        name: str(v.name),
        rule_type: str(v.rule_type) as AttendanceRuleType,
        description: str(v.description),
        is_active: v.is_active !== false,
        priority: int(v.priority),
        late_threshold_minutes: int(v.late_threshold_minutes),
        late_penalty_type: str(v.late_penalty_type) || undefined,
        late_penalty_value: dec('late_penalty_value'),
        overtime_threshold_hours: dec('overtime_threshold_hours'),
        overtime_rate_multiplier: dec('overtime_rate_multiplier'),
        max_overtime_hours: dec('max_overtime_hours'),
        standard_work_hours: dec('standard_work_hours'),
        min_work_hours: dec('min_work_hours'),
        max_work_hours: dec('max_work_hours'),
        consecutive_absent_threshold: int(v.consecutive_absent_threshold),
        monthly_absent_threshold: int(v.monthly_absent_threshold),
        absenteeism_action: str(v.absenteeism_action) || undefined,
        break_duration_minutes: int(v.break_duration_minutes),
        holiday_pay_multiplier: dec('holiday_pay_multiplier')
    };
}

export default function AttendanceRulesPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, error, refetch } = useAttendanceRules({ page, page_size: PAGE_SIZE });
    const save = useSaveAttendanceRule();
    const del = useDeleteAttendanceRule();
    const { results: rows, count } = normalizeList<AttendanceRule>(data);

    const columns: Column<AttendanceRule>[] = [
        { header: 'Name', cell: (r) => <span className="font-medium">{r.name || '—'}</span> },
        { header: 'Type', cell: (r) => typeLabel(r.rule_type) },
        { header: 'Setting', cell: (r) => ruleSummary(r) },
        {
            header: 'Status',
            cell: (r) => <Badge variant={r.is_active === false ? 'secondary' : 'success'}>{r.is_active === false ? 'Inactive' : 'Active'}</Badge>
        }
    ];

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <PageHeader title="Attendance Rules" subtitle="Lateness, overtime, absence, work hours, breaks and holiday pay" />
            <CrudManager
                rows={rows}
                columns={columns}
                fields={fields}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                entityLabel="Attendance Rule"
                perms={{ add: 'add_attendancerule', change: 'change_attendancerule', delete: 'delete_attendancerule' }}
                emptyDescription="No attendance rules configured yet."
                toForm={(r) => ({
                    name: r?.name ?? '',
                    rule_type: r?.rule_type ?? 'late_policy',
                    late_threshold_minutes: r?.late_threshold_minutes ?? 15,
                    late_penalty_type: r?.late_penalty_type ?? 'warning',
                    late_penalty_value: num(r?.late_penalty_value),
                    overtime_threshold_hours: num(r?.overtime_threshold_hours),
                    overtime_rate_multiplier: num(r?.overtime_rate_multiplier),
                    max_overtime_hours: num(r?.max_overtime_hours),
                    consecutive_absent_threshold: r?.consecutive_absent_threshold ?? 3,
                    monthly_absent_threshold: r?.monthly_absent_threshold ?? 5,
                    absenteeism_action: r?.absenteeism_action ?? 'warning',
                    standard_work_hours: num(r?.standard_work_hours),
                    min_work_hours: num(r?.min_work_hours),
                    max_work_hours: num(r?.max_work_hours),
                    break_duration_minutes: r?.break_duration_minutes ?? 60,
                    holiday_pay_multiplier: num(r?.holiday_pay_multiplier),
                    priority: r?.priority ?? 100,
                    is_active: r?.is_active ?? true,
                    description: r?.description ?? ''
                })}
                onSave={({ id, data }, done) => save.mutate({ id, data: toBody(data) }, { onSuccess: done })}
                onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
                saving={save.isPending}
                deleting={del.isPending}
                pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
            />
        </div>
    );
}
