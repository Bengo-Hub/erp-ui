/**
 * Centralized formatting for erp-ui.
 *
 * Single source of truth for currency / number / date / time formatting so payroll,
 * payslips, reports and dashboards render identically. Locale is `en-KE`, the default
 * currency is **KES**, and all date/time output is pinned to the **Africa/Nairobi**
 * timezone (the platform operates in EAT) so server UTC timestamps never drift by host.
 */

export const LOCALE = "en-KE";
export const DEFAULT_CURRENCY = "KES";
export const TIME_ZONE = "Africa/Nairobi";

type Numeric = number | string | null | undefined;

const PLACEHOLDER = "—";

/** Coerce a number|string|null into a finite number, or null. */
function toNumber(value: Numeric): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? (n as number) : null;
}

/** Coerce an ISO string / Date into a valid Date, or null. */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a money amount as a currency string (KES by default).
 * `decimals` controls fraction digits (default 2; pass 0 for whole-shilling headline metrics).
 */
export function formatCurrency(
  value: Numeric,
  currency: string = DEFAULT_CURRENCY,
  decimals = 2,
): string {
  const n = toNumber(value);
  if (n == null) return PLACEHOLDER;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** Format a plain number with thousands separators (no currency symbol). */
export function formatNumber(value: Numeric, decimals?: number): string {
  const n = toNumber(value);
  if (n == null) return PLACEHOLDER;
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? 2,
  }).format(n);
}

/** Format a 0–100 (or 0–1) value as a percentage. Pass `fraction` if the input is 0–1. */
export function formatPercent(value: Numeric, fraction = false): string {
  const n = toNumber(value);
  if (n == null) return PLACEHOLDER;
  const pct = fraction ? n * 100 : n;
  return `${formatNumber(pct, Number.isInteger(pct) ? 0 : 1)}%`;
}

/** Short local date — e.g. "14 Jun 2026" (Africa/Nairobi). */
export function formatDate(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return PLACEHOLDER;
  return d.toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
}

/** Date + time — e.g. "14 Jun 2026, 14:05" (Africa/Nairobi, 24h). */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return PLACEHOLDER;
  return d.toLocaleString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  });
}

/** Time only — e.g. "14:05" (Africa/Nairobi, 24h). */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return PLACEHOLDER;
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  });
}

/** Custom date parts (e.g. weekday/month-day for grids) in the Nairobi timezone. */
export function formatDateParts(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const d = toDate(value);
  if (!d) return PLACEHOLDER;
  return d.toLocaleDateString(LOCALE, { ...options, timeZone: TIME_ZONE });
}
