'use client';

import { Badge } from '@/components/ui/base';
import { type SettingSource } from '@/lib/api/payroll-settings';

/**
 * Where a payroll setting comes from: "Platform default" (defined once for every organisation and
 * inherited), "Customised" (this organisation changed a platform default) or "Own" (created by
 * this organisation).
 */
export function SourceBadge({ source, platform }: { source?: SettingSource; platform?: boolean }) {
    if (source === 'platform') return <Badge variant="outline">Platform default</Badge>;
    if (platform) return <Badge variant="warning">Customised</Badge>;
    return <Badge variant="default">Own</Badge>;
}

/** Plain-language name of the module that produces a component's amounts. */
export const MANAGED_BY_LABEL: Record<string, string> = {
    salary: 'salary details',
    attendance: 'attendance and overtime',
    piece_rates: 'piece rates',
    expense_claims: 'expense claims',
    loans: 'staff loans',
    advances: 'salary advances',
    loss_damages: 'losses and damages',
    staff_purchases: 'staff purchases',
    statutory_formula: 'the statutory formulas'
};
