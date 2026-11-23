"use client";

import { AlertTriangle, CheckCircle2, Clock, Loader2, LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { Field, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/states";
import { useClock, useMyAttendanceToday, useUploadClockPhoto } from "@/hooks/use-attendance-self";
import { useCurrentPosition } from "@/hooks/use-current-position";
import { type ClockResult } from "@/lib/api/attendance-self";
import { formatTime } from "@/lib/format";
import { formatDistance, nearestSite } from "@/lib/geo";
import { cn } from "@/lib/utils";

import { PhotoCapture } from "./photo-capture";

const hhmm = (t?: string) => (t ? t.slice(0, 5) : "");

function Notice({ tone, children }: { tone: "info" | "warn" | "ok"; children: React.ReactNode }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "warn" ? AlertTriangle : MapPin;
  return (
    <p
      role={tone === "warn" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
        tone === "warn" ? "bg-destructive/10 text-foreground" : "bg-muted text-foreground",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-destructive" : tone === "ok" ? "text-green-600" : "text-muted-foreground")} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * Mobile-first clock-in for employee self-service. Location is read only when the person taps,
 * checked against their work sites for an immediate answer, then sent to erp-api, which makes the
 * final inside or outside decision under the tenant's geo policy.
 */
export function ClockInCard() {
  const { data, isLoading } = useMyAttendanceToday();
  const position = useCurrentPosition();
  const record = data?.record ?? null;
  const checkedIn = !!record?.check_in;
  const checkedOut = !!record?.check_out;
  const direction: "in" | "out" = checkedIn && !checkedOut ? "out" : "in";
  const clock = useClock(direction);
  const upload = useUploadClockPhoto();
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [note, setNote] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);
  const [result, setResult] = useState<ClockResult | null>(null);

  if (isLoading) {
    return (
      <Card className="space-y-3 p-4" aria-busy="true">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }
  // Self clock-in is not served by this tenant's erp-api yet.
  if (!data) return null;

  const { policy, sites, shift } = data;
  const needPhoto = policy.require_photo && direction === "in";
  const busy = position.locating || upload.isPending || clock.isPending;
  const fix = position.fix;
  const near = fix && sites.length ? nearestSite(fix.lat, fix.lng, sites, policy.geo_tolerance_m ?? 0) : null;

  const submit = async () => {
    setBlocked(null);
    setResult(null);
    const at = await position.locate();
    if (!at) return;
    const here = sites.length ? nearestSite(at.lat, at.lng, sites, policy.geo_tolerance_m ?? 0) : null;
    if (policy.geo_mode === "block" && here && !here.inside) {
      setBlocked(
        `You are ${formatDistance(here.distanceM)} from ${here.site.name}. Clocking ${direction} works only inside your work site.`,
      );
      return;
    }
    let photoUrl: string | undefined;
    if (needPhoto && photo) {
      const res = await upload.mutateAsync(photo).catch(() => null);
      if (!res) return;
      photoUrl = res.url;
    }
    clock.mutate(
      { lat: at.lat, lng: at.lng, accuracy_m: Math.round(at.accuracyM), photo_url: photoUrl, note: note.trim() || undefined },
      {
        onSuccess: (res) => {
          setResult(res);
          setPhoto(null);
          setNote("");
        },
      },
    );
  };

  const status = checkedOut
    ? `Done for today, ${formatTime(record?.check_in)} to ${formatTime(record?.check_out)}`
    : checkedIn
      ? `In since ${formatTime(record?.check_in)}`
      : "Not clocked in yet";

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Clock className="size-4 text-primary" aria-hidden /> Today
          </h2>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
        {shift?.name && (
          <p className="text-sm text-muted-foreground">
            {shift.name}
            {shift.start_time && ` ${hhmm(shift.start_time)} to ${hhmm(shift.end_time)}`}
          </p>
        )}
      </div>

      {!checkedOut && (
        <>
          {needPhoto && <PhotoCapture value={photo} onChange={setPhoto} />}
          <Field label="Note (optional)" htmlFor="clock-note">
            <Input
              id="clock-note"
              value={note}
              maxLength={200}
              placeholder="For field work: the client or place you are at"
              onChange={(e) => setNote(e.target.value)}
              className="min-h-11"
            />
          </Field>
          <Button
            size="lg"
            className="min-h-12 w-full text-base"
            disabled={busy || (needPhoto && !photo)}
            onClick={() => void submit()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                {position.locating ? "Finding your location" : "Saving"}
              </>
            ) : (
              <>
                <LocateFixed className="mr-2 size-4" aria-hidden />
                {direction === "in" ? "Clock in" : "Clock out"}
              </>
            )}
          </Button>
          {needPhoto && !photo && <p className="text-xs text-muted-foreground">Take a photo to clock in.</p>}
        </>
      )}

      {position.message && <Notice tone="warn">{position.message}</Notice>}
      {blocked && <Notice tone="warn">{blocked}</Notice>}
      {result?.fence && (
        <Notice tone={result.flagged ? "warn" : "ok"}>
          {result.fence.inside
            ? `Inside ${result.fence.site_name ?? "your work site"}.`
            : `${formatDistance(result.fence.distance_m)} from ${result.fence.site_name ?? "your work site"}.`}
          {result.flagged && " Your manager will review this punch."}
        </Notice>
      )}
      {!result && !blocked && near && (
        <Notice tone="info">
          {near.inside
            ? `You are at ${near.site.name}.`
            : `You are ${formatDistance(near.distanceM)} from ${near.site.name}.`}
          {fix && fix.accuracyM > 100 && ` Location is accurate to about ${formatDistance(fix.accuracyM)}.`}
        </Notice>
      )}
    </Card>
  );
}
