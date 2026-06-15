/**
 * erp-api core/business/regional settings.
 *
 * These are mostly singleton-ish config records (DRF returns a list with one
 * row, or a bare object). Callers resolve via `pickSettings`.
 */

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

export interface BusinessSettings {
  id?: number;
  name?: string;
  legal_name?: string;
  kra_pin?: string;
  registration_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  [key: string]: unknown;
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
  save: (_id: number | undefined, data: Partial<BusinessSettings>) =>
    apiClient.put<BusinessSettings>(`/business/settings`, {
      ...data,
      // Map UI field names onto erp-api's settings body.
      contact_email: (data as Record<string, unknown>).contact_email ?? data.email,
      contact_phone: (data as Record<string, unknown>).contact_phone ?? data.phone,
      physical_address: (data as Record<string, unknown>).physical_address ?? data.address,
    }),
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
