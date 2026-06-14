import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { formatCurrency } from "@/lib/format";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a currency amount (defaults to KES).
 * @deprecated Prefer `formatCurrency` from `@/lib/format` — kept as an alias for back-compat.
 */
export function formatMoney(value: number | string | null | undefined, currency = "KES"): string {
  return formatCurrency(value, currency);
}

// Re-export the centralized date/time helpers so existing `@/lib/utils` imports keep working.
export { formatDate, formatDateTime, formatTime, formatNumber } from "@/lib/format";

/** Decode a JWT payload without verifying the signature. Returns {} on failure. */
export function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}
