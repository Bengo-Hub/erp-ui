"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams, type Paginated } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";

export interface CrudResourceApi<T> {
  list: (params?: ListParams) => Promise<Paginated<T> | T[]>;
  get?: (id: number | string) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: number | string, data: Partial<T>) => Promise<T>;
  remove: (id: number | string) => Promise<void>;
}

/**
 * Builds list/detail/save/delete hooks for a DRF CRUD resource.
 * Mirrors the use-hrm-settings factory but exposes a detail hook too.
 */
export function makeResourceHooks<T extends { id: number | string }>(
  key: string,
  api: CrudResourceApi<T>,
  label: string,
) {
  function useList(params?: ListParams) {
    return useQuery({ queryKey: [key, "list", params ?? {}], queryFn: () => api.list(params) });
  }
  function useDetail(id: number | string | undefined) {
    return useQuery({
      queryKey: [key, "detail", id],
      queryFn: () => api.get!(id!),
      enabled: !!id && !!api.get,
    });
  }
  function useSave() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id?: number | string; data: Partial<T> }) =>
        id ? api.update(id, data) : api.create(data),
      onSuccess: (_r, v) => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(v.id ? `${label} updated` : `${label} created`);
      },
      onError: (e) => toast.error(extractApiError(e, `Failed to save ${label.toLowerCase()}`)),
    });
  }
  function useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: number | string) => api.remove(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(`${label} deleted`);
      },
      onError: (e) => toast.error(extractApiError(e, `Failed to delete ${label.toLowerCase()}`)),
    });
  }
  return { useList, useDetail, useSave, useRemove };
}

/** Build a mutation that performs a no-body lifecycle action then invalidates `key`. */
export function makeActionHook<R>(
  key: string,
  action: (id: number | string) => Promise<R>,
  successMsg: string,
  errorMsg: string,
) {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: number | string) => action(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(successMsg);
      },
      onError: (e) => toast.error(extractApiError(e, errorMsg)),
    });
  };
}
