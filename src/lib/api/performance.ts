/** erp-api performance endpoints: reviews (+ lifecycle), metrics. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const PERF = "/hrm/performance";

export interface PerformanceReview {
  id: number;
  employee?: number;
  employee_name?: string;
  reviewer?: number;
  reviewer_name?: string;
  period?: string;
  review_date?: string;
  rating?: string | number;
  overall_rating?: string | number;
  status?: string;
  comments?: string;
  rejection_reason?: string;
  created_at?: string;
  [key: string]: unknown;
}

export const performanceApi = {
  listReviews: (params?: ListParams) =>
    apiClient.get<Paginated<PerformanceReview> | PerformanceReview[]>(
      `${PERF}/performance-reviews/`,
      params,
    ),
  getReview: (id: number | string) =>
    apiClient.get<PerformanceReview>(`${PERF}/performance-reviews/${id}/`),
  createReview: (data: Partial<PerformanceReview>) =>
    apiClient.post<PerformanceReview>(`${PERF}/performance-reviews/`, data),
  updateReview: (id: number | string, data: Partial<PerformanceReview>) =>
    apiClient.put<PerformanceReview>(`${PERF}/performance-reviews/${id}/`, data),
  deleteReview: (id: number | string) =>
    apiClient.delete<void>(`${PERF}/performance-reviews/${id}/`),
  submit: (id: number | string) =>
    apiClient.post<PerformanceReview>(`${PERF}/performance-reviews/${id}/submit/`, {}),
  approve: (id: number | string) =>
    apiClient.post<PerformanceReview>(`${PERF}/performance-reviews/${id}/approve/`, {}),
  reject: (id: number | string, reason: string) =>
    apiClient.post<PerformanceReview>(`${PERF}/performance-reviews/${id}/reject/`, {
      rejection_reason: reason,
    }),
};
