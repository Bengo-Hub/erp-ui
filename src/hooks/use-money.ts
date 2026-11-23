"use client";

import { useCallback } from "react";

import { useRegionalSettings } from "@/hooks/use-settings";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/format";

/**
 * The tenant's reporting currency from its regional settings, with a formatter bound to it.
 * Amounts that carry their own currency (a piece rate, a payslip) pass it explicitly.
 */
export function useMoney() {
  const { settings } = useRegionalSettings();
  const currency =
    (settings?.default_currency as string | undefined) ||
    (settings?.currency_code as string | undefined) ||
    DEFAULT_CURRENCY;
  const format = useCallback(
    (value: number | string | null | undefined, decimals = 0, override?: string) =>
      formatCurrency(value, override || currency, decimals),
    [currency],
  );
  return { currency, format };
}
