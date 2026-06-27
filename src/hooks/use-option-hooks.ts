"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDepartments, useJobGroups, useJobTitles } from "@/hooks/use-hrm-settings";
import { useLeaveCategories } from "@/hooks/use-leave";
import { apiClient } from "@/lib/api/client";
import { normalizeList } from "@/lib/api/drf";
import { type Department, type JobGroup, type NamedRecord } from "@/lib/api/hrm-settings";
import { type LeaveCategory } from "@/lib/api/leave";

export interface Option {
  value: string;
  label: string;
}
export interface OptionsResult {
  options: Option[];
  isLoading: boolean;
}

/** Departments as `{value,label}` options. */
export function useDepartmentOptions(): OptionsResult {
  const { data, isLoading } = useDepartments({ limit: 500 });
  const options = useMemo(
    () =>
      normalizeList<Department>(data).results.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
    [data],
  );
  return { options, isLoading };
}

/** Job groups as `{value,label}` options. */
export function useJobGroupOptions(): OptionsResult {
  const { data, isLoading } = useJobGroups({ limit: 500 });
  const options = useMemo(
    () =>
      normalizeList<JobGroup>(data).results.map((g) => ({
        value: String(g.id),
        label: g.grade ? `${g.name} (${g.grade})` : g.name,
      })),
    [data],
  );
  return { options, isLoading };
}

/** Job titles as `{value,label}` options. A job posting's `title` is a text label, so the
 * option value is the title NAME (the combobox also accepts a freely-typed new title). */
export function useJobTitleOptions(): OptionsResult {
  const { data, isLoading } = useJobTitles({ limit: 500 });
  const options = useMemo(
    () =>
      normalizeList<NamedRecord>(data).results.map((t) => {
        const label = t.name ?? (t as { title?: string }).title ?? String(t.id);
        return { value: label, label };
      }),
    [data],
  );
  return { options, isLoading };
}

/** Leave types (categories) as `{value,label}` options. */
export function useLeaveTypeOptions(): OptionsResult {
  const { data, isLoading } = useLeaveCategories({ limit: 500 });
  const options = useMemo(
    () =>
      normalizeList<LeaveCategory>(data).results.map((c) => ({
        value: String(c.id),
        label: c.name ?? String(c.id),
      })),
    [data],
  );
  return { options, isLoading };
}

/** Shared loader for the erp-api cost-allocation lookup endpoints (S2S proxy to projects-service /
 * treasury, with a server-side distinct-values fallback). Returns {results|data: [{value,label}]}. */
function useLookup(path: string, key: string): OptionsResult {
  const { data, isLoading } = useQuery({
    queryKey: ["pay-lookup", key],
    queryFn: () => apiClient.get<{ results?: Option[]; data?: Option[] }>(path),
    staleTime: 5 * 60 * 1000,
  });
  const options = useMemo(() => data?.results ?? data?.data ?? [], [data]);
  return { options, isLoading };
}

/** Project options — from GET /hrm/payroll/lookups/projects (projects-service S2S, fallback to
 * distinct project IDs on erp records). The combobox still accepts typed values for new IDs. */
export function useProjectOptions(): OptionsResult {
  return useLookup("/hrm/payroll/lookups/projects", "projects");
}

/** Cost-center options — from GET /hrm/payroll/lookups/cost-centers (treasury S2S, fallback to
 * distinct cost_center IDs on erp records). */
export function useCostCenterOptions(): OptionsResult {
  return useLookup("/hrm/payroll/lookups/cost-centers", "cost-centers");
}
