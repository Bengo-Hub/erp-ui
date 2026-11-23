/** Piece-rate pay: rates per operation or item, and daily output per employee with QC rejects. */

import { apiClient } from "@/lib/api/client";
import { type Paginated } from "@/lib/api/drf";
import { emptyPage, orFallback } from "@/lib/api/not-found";

const PAY = "/hrm/payroll";

export interface PieceRate {
  id: string;
  code: string;
  name: string;
  unit: string;
  rate: number | string;
  currency: string;
  department_id?: string | null;
  department_name?: string | null;
  effective_from: string;
  effective_to?: string | null;
}

export type PieceRateInput = Omit<PieceRate, "id" | "department_name">;

export type OutputStatus = "pending" | "approved" | "rejected";

export interface PieceOutput {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  piece_rate_id: string;
  piece_rate_name?: string;
  unit?: string;
  quantity: number;
  rejected_quantity: number;
  /** Paid units times the rate, when the API computes it. */
  amount?: number | string;
  currency?: string;
  note?: string | null;
  status: OutputStatus;
}

export interface PieceOutputInput {
  employee_id: string;
  date: string;
  piece_rate_id: string;
  quantity: number;
  rejected_quantity: number;
  note?: string;
}

export interface OutputFilters {
  from?: string;
  to?: string;
  employee_id?: string;
  piece_rate_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const pieceRatesApi = {
  list: (params?: object) => orFallback(apiClient.get<Paginated<PieceRate>>(`${PAY}/piece-rates`, params), emptyPage<PieceRate>()),
  create: (data: PieceRateInput) => apiClient.post<PieceRate>(`${PAY}/piece-rates`, data),
  update: (id: string, data: Partial<PieceRateInput>) => apiClient.patch<PieceRate>(`${PAY}/piece-rates/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`${PAY}/piece-rates/${id}`),
};

export const pieceOutputsApi = {
  list: (params?: OutputFilters) =>
    orFallback(apiClient.get<Paginated<PieceOutput>>(`${PAY}/piece-outputs`, params), emptyPage<PieceOutput>()),
  create: (data: PieceOutputInput) => apiClient.post<PieceOutput>(`${PAY}/piece-outputs`, data),
  review: (ids: string[], action: "approve" | "reject") =>
    apiClient.post<{ updated: number }>(`${PAY}/piece-outputs/review`, { ids, action }),
};
