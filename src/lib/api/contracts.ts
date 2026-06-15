/** erp-api employee contracts (/hrm/contracts). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

export interface Contract {
  id: number | string;
  employee?: number | string | { id: number | string; name?: string } | null;
  employee_name?: string;
  employee_number?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salary?: string | number;
  pay_type?: string;
  status?: string;
  notes?: string;
  contract_duration?: number;
  [key: string]: unknown;
}

const BASE = "/hrm/contracts";

export const contractsApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Contract> | Contract[]>(`${BASE}/`, params),
  get: (id: number | string) => apiClient.get<Contract>(`${BASE}/${id}/`),
  create: (data: Partial<Contract>) => apiClient.post<Contract>(`${BASE}/`, data),
  update: (id: number | string, data: Partial<Contract>) =>
    apiClient.put<Contract>(`${BASE}/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`${BASE}/${id}/`),
};
