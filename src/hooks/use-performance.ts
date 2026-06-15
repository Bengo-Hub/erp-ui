"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { performanceApi, type PerformanceReview } from "@/lib/api/performance";
import { type ListParams } from "@/lib/api/drf";
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
