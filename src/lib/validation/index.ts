/**
 * Shared zod refinements for ERP forms. Centralizing them here keeps validation consistent
 * across forms (employee, leave, payroll, appraisals) and turns zod — previously installed but
 * unused — into the single source of truth for client-side input rules. Pair with
 * `zodResolver` from @hookform/resolvers/zod on react-hook-form, or call `.safeParse` directly
 * for non-RHF forms.
 */
import { z } from "zod";

/** Optional email — empty string allowed (treated as "not provided"). */
export const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || z.string().email().safeParse(v).success, {
    message: "Enter a valid email address",
  });

/** Optional Kenyan KRA PIN: a letter, 9 digits, a letter (e.g. A012345678Z). Case-insensitive. */
export const optionalKraPin = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^[A-Za-z]\d{9}[A-Za-z]$/.test(v), {
    message: "PIN format: letter + 9 digits + letter (e.g. A012345678Z)",
  });

/** Optional national ID — 5–10 digits. */
export const optionalNationalId = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{5,10}$/.test(v), { message: "National ID must be 5–10 digits" });

/** Optional phone — digits, spaces, +, -, (), 7–15 chars of digits. */
export const optionalPhone = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^[+]?[\d\s()-]{7,20}$/.test(v), { message: "Enter a valid phone number" });

/** A money/decimal string that, when provided, must parse to a number > 0. Empty = not provided. */
export const optionalPositiveMoney = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) > 0), {
    message: "Must be a number greater than zero",
  });

/** A required money/decimal string that must parse to a number > 0. */
export const requiredPositiveMoney = z
  .string()
  .trim()
  .min(1, "Required")
  .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
    message: "Must be a number greater than zero",
  });

/** A money/decimal string that, when provided, must parse to a number ≥ 0. */
export const optionalNonNegativeMoney = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: "Must be a non-negative number",
  });

/** An optional date string (YYYY-MM-DD) that, when provided, must not be in the future. */
export const optionalPastOrTodayDate = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || new Date(v) <= new Date(), { message: "Date cannot be in the future" });

/**
 * Cross-field refinement: end date (if both present) must not be before start date. Apply with
 * `.refine(endNotBeforeStart("start_date", "end_date"), { message, path })` on an object schema.
 */
export function endNotBeforeStart<T extends Record<string, unknown>>(startKey: keyof T, endKey: keyof T) {
  return (obj: T) => {
    const s = obj[startKey] as string | undefined;
    const e = obj[endKey] as string | undefined;
    if (!s || !e) return true;
    return new Date(e) >= new Date(s);
  };
}
