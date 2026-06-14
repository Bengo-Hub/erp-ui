"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams, type Paginated } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  departmentsApi,
  jobGroupsApi,
  jobTitlesApi,
  type Department,
  type JobGroup,
  type NamedRecord,
} from "@/lib/api/hrm-settings";

interface CrudApi<T> {
  list: (params?: ListParams) => Promise<Paginated<T> | T[]>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: number | string, data: Partial<T>) => Promise<T>;
  remove: (id: number | string) => Promise<void>;
}

/** Build list/save/delete hooks for a named-record HRM resource. */
function makeCrudHooks<T extends { id: number }>(key: string, api: CrudApi<T>, label: string) {
  function useList(params?: ListParams) {
    return useQuery({ queryKey: [key, "list", params ?? {}], queryFn: () => api.list(params) });
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
  return { useList, useSave, useRemove };
}

const departments = makeCrudHooks<Department>("departments", departmentsApi, "Department");
export const useDepartments = departments.useList;
export const useSaveDepartment = departments.useSave;
export const useDeleteDepartment = departments.useRemove;

const jobTitles = makeCrudHooks<NamedRecord>("job-titles", jobTitlesApi, "Job title");
export const useJobTitles = jobTitles.useList;
export const useSaveJobTitle = jobTitles.useSave;
export const useDeleteJobTitle = jobTitles.useRemove;

const jobGroups = makeCrudHooks<JobGroup>("job-groups", jobGroupsApi, "Job group");
export const useJobGroups = jobGroups.useList;
export const useSaveJobGroup = jobGroups.useSave;
export const useDeleteJobGroup = jobGroups.useRemove;
