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

/** Resolve a singleton config record from DRF's various envelopes. */
export function pickSettings<T>(data: T | Paginated<T> | T[] | null | undefined): T | undefined {
  if (!data) return undefined;
  if (Array.isArray(data)) return data[0];
  if (typeof data === "object" && "results" in (data as object)) {
    return (data as Paginated<T>).results?.[0];
  }
  return data as T;
}

/** Build a singleton settings surface: GET list + create/update (id-aware). */
function singletonApi<T extends { id?: number }>(base: string) {
  return {
    get: () => apiClient.get<Paginated<T> | T[] | T>(`${base}/`),
    save: (id: number | undefined, data: Partial<T>) =>
      id != null
        ? apiClient.put<T>(`${base}/${id}/`, data)
        : apiClient.post<T>(`${base}/`, data),
  };
}

export const regionalSettingsApi = singletonApi<RegionalSettings>("/core/regional-settings");
export const businessSettingsApi = singletonApi<BusinessSettings>("/business/business");
export const brandingSettingsApi = {
  get: () => apiClient.get<BrandingSettings>(`/core/branding-settings/`),
};
