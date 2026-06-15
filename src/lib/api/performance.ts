/** erp-api performance endpoints: reviews (+ lifecycle), metrics. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const PERF = "/hrm/performance";

export interface PerformanceReview {
  id: number | string;
  employee?: number | string;
  employee_name?: string;
  title?: string;
  description?: string;
  reviewer?: number | string;
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

// erp-api review segment is "reviews" (not "performance-reviews"), and
// lifecycle is a single status setter PUT /reviews/{id}/status.
const REVIEWS = `${PERF}/reviews`;

export const performanceApi = {
  listReviews: (params?: ListParams) =>
    apiClient.get<Paginated<PerformanceReview> | PerformanceReview[]>(`${REVIEWS}/`, params),
  getReview: (id: number | string) =>
    apiClient.get<PerformanceReview>(`${REVIEWS}/${id}/`),
  createReview: (data: Partial<PerformanceReview>) =>
    apiClient.post<PerformanceReview>(`${REVIEWS}/`, {
      employee_id: data.employee,
      title: data.title,
      description: data.description,
      review_date: data.review_date,
      reviewer_id: data.reviewer,
    }),
  setStatus: (id: number | string, status: string, overallRating?: string) =>
    apiClient.put<PerformanceReview>(`${REVIEWS}/${id}/status`, {
      status,
      overall_rating: overallRating,
    }),
  submit: (id: number | string) =>
    apiClient.put<PerformanceReview>(`${REVIEWS}/${id}/status`, { status: "submitted" }),
  approve: (id: number | string) =>
    apiClient.put<PerformanceReview>(`${REVIEWS}/${id}/status`, { status: "approved" }),
  reject: (id: number | string, reason: string) =>
    apiClient.put<PerformanceReview>(`${REVIEWS}/${id}/status`, {
      status: "rejected",
      overall_rating: reason,
    }),
  // Review metrics (scoped under a review).
  listReviewMetrics: (id: number | string) => apiClient.get(`${REVIEWS}/${id}/metrics`),
  upsertReviewMetric: (id: number | string, data: Record<string, unknown>) =>
    apiClient.put(`${REVIEWS}/${id}/metrics`, data),
  // NOTE: erp-api has no review update/delete (gap); kept on canonical paths.
  updateReview: (id: number | string, data: Partial<PerformanceReview>) =>
    apiClient.put<PerformanceReview>(`${REVIEWS}/${id}/`, data),
  deleteReview: (id: number | string) => apiClient.delete<void>(`${REVIEWS}/${id}/`),
};
