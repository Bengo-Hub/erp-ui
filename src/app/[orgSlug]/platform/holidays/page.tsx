'use client';

import { PublicHolidaysManager } from '@/components/hrm/public-holidays-manager';
import { EmptyState } from '@/components/ui/states';
import { useAppPermissions } from '@/hooks/use-app-permissions';

/** The platform's national holiday calendar, which every organisation inherits. */
export default function PlatformHolidaysPage() {
    const { isPlatformOwner } = useAppPermissions();
    if (!isPlatformOwner) {
        return (
            <div className="p-4 sm:p-6">
                <EmptyState title="Platform owners only" description="The platform holiday calendar is kept by the platform owner. Your organisation's holidays are under Leave, Public Holidays." />
            </div>
        );
    }
    return <PublicHolidaysManager platform />;
}
