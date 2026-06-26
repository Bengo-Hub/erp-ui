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

export interface MetricCategory {
  id: string;
  name?: string;
  description?: string;
  order?: number;
  [key: string]: unknown;
}

export interface PerformanceMetric {
  id: string;
  category_id?: string;
  category_name?: string;
  name?: string;
  description?: string;
  metric_type?: string;
  unit?: string;
  min_value?: string | number;
  max_value?: string | number;
  target_value?: string | number;
  [key: string]: unknown;
}

export interface EmployeeMetric {
  id: string;
  employee_id?: string;
  employee_name?: string;
  metric_id?: string;
  metric_name?: string;
  value?: string | number;
  date_recorded?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface MetricTarget {
  id: string;
  employee_id?: string;
  employee_name?: string;
  metric_id?: string;
  metric_name?: string;
  target_value?: string | number;
  period_start?: string;
  period_end?: string;
  [key: string]: unknown;
}

export interface ReviewMetric {
  id: string;
  metric_id?: string;
  metric_name?: string;
  value?: string | number;
  rating?: string | number;
  comments?: string;
  [key: string]: unknown;
}

export const METRIC_TYPES = [
  { value: "numeric", label: "Numeric" },
  { value: "percentage", label: "Percentage" },
  { value: "rating", label: "Rating (1–5)" },
  { value: "boolean", label: "Yes / No" },
] as const;

// erp-api review segment is "reviews" (not "performance-reviews"), and
// lifecycle is a single status setter PUT /reviews/{id}/status.
const REVIEWS = `${PERF}/reviews`;

/** Metric framework: categories → metrics → per-employee targets & recorded values. */
export const performanceSetupApi = {
  categories: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<MetricCategory> | MetricCategory[]>(`${PERF}/categories`, params),
    create: (data: Partial<MetricCategory>) =>
      apiClient.post<MetricCategory>(`${PERF}/categories`, data),
  },
  metrics: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<PerformanceMetric> | PerformanceMetric[]>(`${PERF}/metrics`, params),
    create: (data: Partial<PerformanceMetric>) =>
      apiClient.post<PerformanceMetric>(`${PERF}/metrics`, data),
  },
  employeeMetrics: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<EmployeeMetric> | EmployeeMetric[]>(`${PERF}/employee-metrics`, params),
    record: (data: Partial<EmployeeMetric>) =>
      apiClient.post<EmployeeMetric>(`${PERF}/employee-metrics`, data),
  },
  targets: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<MetricTarget> | MetricTarget[]>(`${PERF}/targets`, params),
    set: (data: Partial<MetricTarget>) => apiClient.post<MetricTarget>(`${PERF}/targets`, data),
  },
};

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
