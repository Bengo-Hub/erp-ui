"use client";

import { Clock } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/states";
import { Card } from "@/components/ui/base";
import { type AttendanceAnalytics } from "@/lib/api/attendance-analytics";
import { TIME_ZONE } from "@/lib/format";

import { AttendanceCharts } from "./attendance-charts";
import { TodayStrip } from "./today-strip";

const todayLabel = () =>
  new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE });

/**
 * Today's strip and the attendance charts, with the loading, error and "not available yet"
 * states handled in one place for both dashboards.
 */
export function AttendanceOverview({
  data,
  isLoading,
  error,
  onRetry,
  orgSlug,
  showDevices,
  showCharts,
}: {
  data: AttendanceAnalytics | null | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  orgSlug: string;
  showDevices: boolean;
  showCharts: boolean;
}) {
  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (!isLoading && data === null) {
    return (
      <Card>
        <EmptyState
          icon={<Clock className="size-6" />}
          title="Attendance figures are not available yet"
          description="They appear here once clock-ins arrive from devices or the self-service app."
        />
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <TodayStrip data={data} isLoading={isLoading} dateLabel={todayLabel()} showDevices={showDevices} orgSlug={orgSlug} />
      {showCharts && data && <AttendanceCharts data={data} />}
    </div>
  );
}
