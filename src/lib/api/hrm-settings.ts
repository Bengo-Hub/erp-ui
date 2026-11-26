/** erp-api HRM org settings: departments, job titles, job groups. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const EMP = "/hrm/employees";
const HRM = "/hrm";

export interface NamedRecord {
  id: number;
  name: string;
  description?: string;
  code?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface Department extends NamedRecord {
  region?: number | null;
  head?: number | null;
  /** Treasury cost center that absorbs this department's payroll cost not allocated to a project. */
  cost_center_id?: string | null;
}

export interface JobGroup extends NamedRecord {
  grade?: string;
  min_salary?: string | number;
  max_salary?: string | number;
  /** A platform job group every organisation inherits; its description can be customised. */
  inherited?: boolean;
  /** An inherited job group this organisation changed. */
  customised?: boolean;
}

/** Generic CRUD factory for a DRF named-record endpoint. */
function crud<T extends { id: number }>(base: string) {
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

export const departmentsApi = crud<Department>(`${HRM}/departments`);
export const jobTitlesApi = crud<NamedRecord>(`${EMP}/job-titles`);
export const jobGroupsApi = crud<JobGroup>(`${EMP}/job-groups`);
/** Drops this organisation's changes to an inherited job group. */
export const revertJobGroup = (id: number | string) =>
  apiClient.delete<JobGroup>(`${EMP}/job-groups/${id}/customisation`);
