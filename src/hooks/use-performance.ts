"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  performanceApi,
  performanceSetupApi,
  type EmployeeMetric,
  type MetricCategory,
  type MetricTarget,
  type PerformanceMetric,
  type PerformanceReview,
  type ReviewMetric,
} from "@/lib/api/performance";
import { type ListParams, type Paginated } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import { makeActionHook } from "@/hooks/use-crud-resource";

const KEY = "performance-reviews";

export function usePerformanceReviews(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "list", params ?? {}],
    queryFn: () => performanceApi.listReviews(params),
  });
}

export function usePerformanceReview(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => performanceApi.getReview(id!),
    enabled: !!id,
  });
}

export function useSavePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<PerformanceReview> }) =>
      id ? performanceApi.updateReview(id, data) : performanceApi.createReview(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(v.id ? "Review updated" : "Review created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save review")),
  });
}

export function useDeletePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => performanceApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Review deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete review")),
  });
}

export const useSubmitReview = makeActionHook(KEY, (id) => performanceApi.submit(id), "Review submitted", "Failed to submit review");
export const useApproveReview = makeActionHook(KEY, (id) => performanceApi.approve(id), "Review approved", "Failed to approve review");

export function useRejectReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      performanceApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Review rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to reject review")),
  });
}

/* ---- Metric framework: categories → metrics → targets / recorded values ---- */
const SETUP_KEY = "performance-setup";

export function useMetricCategories(params?: ListParams) {
  return useQuery({
    queryKey: [SETUP_KEY, "categories", params ?? {}],
    queryFn: () => performanceSetupApi.categories.list(params),
  });
}

export function useSaveMetricCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MetricCategory>) => performanceSetupApi.categories.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETUP_KEY, "categories"] });
      toast.success("Category saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save category")),
  });
}

export function usePerformanceMetrics(params?: ListParams) {
  return useQuery({
    queryKey: [SETUP_KEY, "metrics", params ?? {}],
    queryFn: () => performanceSetupApi.metrics.list(params),
  });
}

export function useSavePerformanceMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PerformanceMetric>) => performanceSetupApi.metrics.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETUP_KEY, "metrics"] });
      toast.success("Metric saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save metric")),
  });
}

export function useMetricTargets(params?: ListParams) {
  return useQuery({
    queryKey: [SETUP_KEY, "targets", params ?? {}],
    queryFn: () => performanceSetupApi.targets.list(params),
  });
}

export function useSetMetricTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MetricTarget>) => performanceSetupApi.targets.set(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETUP_KEY, "targets"] });
      toast.success("Target set");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to set target")),
  });
}

export function useEmployeeMetrics(params?: ListParams) {
  return useQuery({
    queryKey: [SETUP_KEY, "employee-metrics", params ?? {}],
    queryFn: () => performanceSetupApi.employeeMetrics.list(params),
  });
}

export function useRecordEmployeeMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmployeeMetric>) => performanceSetupApi.employeeMetrics.record(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETUP_KEY, "employee-metrics"] });
      toast.success("Value recorded");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to record value")),
  });
}

/* ---- Per-review metric scoring ---- */
export function useReviewMetrics(reviewId: number | string | null) {
  return useQuery({
    queryKey: [KEY, "metrics", reviewId],
    queryFn: () => performanceApi.listReviewMetrics(reviewId!) as Promise<Paginated<ReviewMetric> | ReviewMetric[]>,
    enabled: !!reviewId,
  });
}

export function useUpsertReviewMetric(reviewId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReviewMetric>) => performanceApi.upsertReviewMetric(reviewId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "metrics", reviewId] });
      toast.success("Score saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save score")),
  });
}
