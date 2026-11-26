'use client';

import { Badge } from '@/components/ui/base';

/**
 * Where a shared setting (leave type, job group, appraisal template or question, sample goal,
 * public holiday) comes from: "Platform default" (defined once and inherited by every
 * organisation), "Customised" (this organisation changed a platform default; revert drops the
 * change) or "Own" (created by this organisation).
 */
export function InheritedBadge({ inherited, customised }: { inherited?: boolean; customised?: boolean }) {
    if (inherited && customised) return <Badge variant="warning">Customised</Badge>;
    if (inherited) return <Badge variant="outline">Platform default</Badge>;
    return <Badge variant="default">Own</Badge>;
}
