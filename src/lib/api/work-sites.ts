/** erp-api work sites (geo-fences for self clock-in): /hrm/attendance/work-sites. */

import { apiClient } from "@/lib/api/client";
import { type Paginated } from "@/lib/api/drf";
import { emptyPage, orFallback } from "@/lib/api/not-found";

const BASE = "/hrm/attendance/work-sites";

export interface WorkSite {
  id: string;
  name: string;
  outlet_id?: string | null;
  center: { lat: number; lng: number };
  radius_m: number;
  /** Optional polygon as an open ring of [lng, lat]. When set it is the fence instead of the circle. */
  ring?: number[][] | null;
  active: boolean;
}

export type WorkSiteInput = Omit<WorkSite, "id">;

export const workSitesApi = {
  list: (params?: Record<string, unknown>) =>
    orFallback(apiClient.get<Paginated<WorkSite>>(BASE, params), emptyPage<WorkSite>()),
  create: (data: WorkSiteInput) => apiClient.post<WorkSite>(BASE, data),
  update: (id: string, data: Partial<WorkSiteInput>) => apiClient.patch<WorkSite>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`${BASE}/${id}`),
};
