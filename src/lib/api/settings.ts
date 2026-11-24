/**
 * erp-api core/business/regional settings.
 *
 * These are mostly singleton-ish config records (DRF returns a list with one
 * row, or a bare object). Callers resolve via `pickSettings`.
 */

import { authAdminClient } from "@/lib/api/auth-admin-client";
import { apiClient } from "@/lib/api/client";
import { type Paginated } from "@/lib/api/drf";

export interface RegionalSettings {
  id?: number;
  default_currency?: string;
  currency_code?: string;
  currency_symbol?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  number_format?: string;
  fiscal_year_start?: string;
  language?: string;
  [key: string]: unknown;
}

/**
 * ERP-owned company settings (erp-api /business/settings). Company identity (name, KRA PIN,
 * contacts, country, logo) belongs to the accounts service and is read with useTenantProfile.
 */
export interface BusinessSettings {
  id?: number;
  legal_name?: string;
  nssf_employer_no?: string;
  shif_employer_no?: string;
  postal_address?: string;
  physical_address?: string;
  financial_year_start_month?: number;
  default_currency?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  [key: string]: unknown;
}

/** The company identity kept in the accounts service, read-only in the ERP. */
export interface TenantProfile {
  name: string;
  tax_pin?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  country?: string;
  timezone?: string;
  logo_url?: string;
}

export interface BrandingSettings {
  id?: number;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  name?: string;
  [key: string]: unknown;
}

/** Resolve a singleton config record from the various envelopes. */
export function pickSettings<T>(data: T | Paginated<T> | T[] | null | undefined): T | undefined {
  if (!data) return undefined;
  if (Array.isArray(data)) return data[0];
  // erp-api business settings wrap the record as {settings: row}.
  if (typeof data === "object" && "settings" in (data as object)) {
    return (data as { settings?: T }).settings ?? undefined;
  }
  if (typeof data === "object" && "data" in (data as object)) {
    const inner = (data as Paginated<T>).data;
    if (Array.isArray(inner)) return inner[0];
  }
  if (typeof data === "object" && "results" in (data as object)) {
    return (data as Paginated<T>).results?.[0];
  }
  return data as T;
}

/**
 * erp-api business settings are a true per-tenant singleton:
 * GET/PUT /business/settings (no id, no list). The save signature keeps the
 * (id, data) shape used by the page but ignores id.
 */
export const businessSettingsApi = {
  get: () => apiClient.get<BusinessSettings>(`/business/settings`),
  // The API applies only the keys sent, so each tab saves just its own fields.
  save: (_id: number | undefined, data: Partial<BusinessSettings>) =>
    apiClient.put<BusinessSettings>(`/business/settings`, data),
};

/** Company identity from the accounts service (tenant members may read their own tenant). */
export const tenantProfileApi = {
  get: async (): Promise<TenantProfile | null> => {
    const id = authAdminClient.activeTenantId;
    if (!id) return null;
    const t = await authAdminClient.get<Record<string, unknown>>(`/admin/tenants/${id}`);
    const s = (k: string) => (typeof t[k] === "string" && t[k] ? (t[k] as string) : undefined);
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    return {
      name: s("name") ?? "",
      tax_pin: s("tax_pin") ?? (typeof meta.kra_pin === "string" ? meta.kra_pin : undefined),
      contact_email: s("contact_email"),
      contact_phone: s("contact_phone"),
      website: s("website"),
      country: s("country"),
      timezone: s("timezone"),
      logo_url: s("logo_url"),
    };
  },
};

// NOTE: erp-api has no /core/regional-settings or /core/branding-settings
// routes (gap). Regional config currently lives inside business settings;
// public branding is exposed at /business/public-branding instead.
export const regionalSettingsApi = {
  get: () => apiClient.get<BusinessSettings>(`/business/settings`),
  save: (_id: number | undefined, data: Partial<RegionalSettings>) =>
    apiClient.put<BusinessSettings>(`/business/settings`, data),
};
export const brandingSettingsApi = {
  get: () => apiClient.get<BrandingSettings>(`/business/public-branding`),
};

/** Per-tenant document-numbering sequence (e.g. payslip → PAY-2026-000123). */
export interface DocumentSequence {
  id?: string;
  doc_type: string;
  prefix?: string;
  separator?: string;
  date_format?: string;
  padding?: number;
  reset_freq?: string;
  current_val?: number;
  [key: string]: unknown;
}

/** Known erp-api document types that support numbering sequences. */
export const DOC_TYPES = [
  { value: "payslip", label: "Payslip" },
  { value: "payroll_report", label: "Payroll Report" },
  { value: "p9", label: "P9 Tax Card" },
  { value: "p10a", label: "P10A Return" },
  { value: "muster_roll", label: "Muster roll" },
  { value: "payment_voucher", label: "Payment voucher" },
  { value: "employee_number", label: "Staff number" },
] as const;

export const RESET_FREQUENCIES = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const businessSequencesApi = {
  list: () => apiClient.get<Paginated<DocumentSequence> | DocumentSequence[]>(`/business/sequences`),
  // erp-api upserts by doc_type (no id, no delete) — PUT /business/sequences.
  upsert: (data: Partial<DocumentSequence>) =>
    apiClient.put<DocumentSequence>(`/business/sequences`, data),
};
