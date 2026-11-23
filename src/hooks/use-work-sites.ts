"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import { workSitesApi, type WorkSiteInput } from "@/lib/api/work-sites";

const KEY = ["work-sites"];

export function useWorkSites(params?: Record<string, unknown>) {
  return useQuery({ queryKey: [...KEY, params ?? {}], queryFn: () => workSitesApi.list(params) });
}

export function useSaveWorkSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: WorkSiteInput }) =>
      id ? workSitesApi.update(id, data) : workSitesApi.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(v.id ? "Work site updated" : "Work site added");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not save the work site")),
  });
}

export function useDeleteWorkSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workSitesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Work site removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not remove the work site")),
  });
}
