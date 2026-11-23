"use client";

import { Fingerprint, LogOut, MapPin, ScanLine, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/base";
import { Skeleton } from "@/components/ui/states";
import { type AttendanceAnalytics } from "@/lib/api/attendance-analytics";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Splits today's expected workforce into parts that do not overlap. Late staff are present, so
 * "on time" is present less late. Whoever is expected and not yet accounted for is "not in yet".
 */
function segmentsFor(t: AttendanceAnalytics["today"]): Segment[] {
  const onTime = Math.max(0, t.present - t.late);
  const accounted = t.present + t.absent + t.on_leave;
  const notIn = Math.max(0, t.expected - accounted);
  return [
    { key: "on_time", label: "On time", value: onTime, color: "var(--series-1)" },
    { key: "late", label: "Late", value: t.late, color: "var(--series-2)" },
    { key: "absent", label: "Absent", value: t.absent, color: "var(--series-3)" },
    { key: "on_leave", label: "On leave", value: t.on_leave, color: "var(--series-4)" },
    { key: "not_in", label: "Not in yet", value: notIn, color: "var(--series-neutral)" },
  ];
}

function Signal({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  tone?: "attention";
}) {
  const body = (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm",
        href && "transition-colors hover:bg-muted",
      )}
    >
      <Icon className={cn("size-4", tone === "attention" ? "text-destructive" : "text-muted-foreground")} aria-hidden />
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
  return href ? (
    <Link href={href} className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

/**
 * Today's workforce as one proportional bar with labelled counts. The headline is how many of the
 * people expected today are in; the signals below carry field staff, early leavers and, for people
 * who manage devices, unmatched punches and device health.
 */
export function TodayStrip({
  data,
  isLoading,
  dateLabel,
  showDevices,
  orgSlug,
}: {
  data: AttendanceAnalytics | null | undefined;
  isLoading: boolean;
  dateLabel: string;
  showDevices: boolean;
  orgSlug: string;
}) {
  if (isLoading) {
    return (
      <Card className="space-y-4 p-4 sm:p-5" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
      </Card>
    );
  }
  if (!data) return null;

  const t = data.today;
  const segments = segmentsFor(t);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const inNow = t.present;
  const rate = t.expected > 0 ? Math.round((inNow / t.expected) * 100) : null;
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(", ");

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
          <p className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
            {formatNumber(inNow, 0)}
            <span className="text-lg font-semibold text-muted-foreground sm:text-xl"> of {formatNumber(t.expected, 0)} in</span>
          </p>
        </div>
        {rate != null && <p className="text-sm font-medium text-muted-foreground">{rate}% attendance so far</p>}
      </div>

      {total > 0 ? (
        <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`Today: ${summary}`}>
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                title={`${s.label}: ${s.value}`}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color, minWidth: 4 }}
              />
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nobody is rostered for today yet.</p>
      )}

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground sm:ml-0">{formatNumber(s.value, 0)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Signal icon={MapPin} label="in the field" value={formatNumber(t.field, 0)} />
        <Signal icon={LogOut} label="left early" value={formatNumber(t.early_leave, 0)} />
        {showDevices && (
          <>
            <Signal
              icon={ScanLine}
              label="unmatched punches"
              value={formatNumber(t.unmatched_punches, 0)}
              href={`/${orgSlug}/hrm/attendance/punches?unmatched=true`}
              tone={t.unmatched_punches > 0 ? "attention" : undefined}
            />
            <Signal
              icon={Fingerprint}
              label="devices online"
              value={`${formatNumber(data.devices.online, 0)}/${formatNumber(data.devices.total, 0)}`}
              href={`/${orgSlug}/hrm/attendance/devices`}
              tone={data.devices.total > data.devices.online ? "attention" : undefined}
            />
          </>
        )}
      </div>
    </Card>
  );
}
