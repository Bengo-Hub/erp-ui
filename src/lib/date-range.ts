import { TIME_ZONE } from "@/lib/format";

/** YYYY-MM-DD for a date in the platform timezone (en-CA formats as ISO). */
export function isoDay(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

/** YYYY-MM-DD for `n` days before today. */
export function daysAgo(n: number): string {
  return isoDay(new Date(Date.now() - n * 86_400_000));
}

/** "just now", "4 min ago", "3 h ago", or a date for anything older than a day. */
export function timeAgo(value?: string | null): string {
  if (!value) return "Never";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "Never";
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: TIME_ZONE });
}
