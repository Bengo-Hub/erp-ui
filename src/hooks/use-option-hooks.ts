"use client";

import { useMemo } from "react";

import { useDepartments, useJobGroups } from "@/hooks/use-hrm-settings";
import { useLeaveCategories } from "@/hooks/use-leave";
import {
  useCasualLabor,
  useProjectAllocations,
} from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type Department, type JobGroup } from "@/lib/api/hrm-settings";
import { type LeaveCategory } from "@/lib/api/leave";
import { type CasualLabor, type ProjectAllocation } from "@/lib/api/payroll";

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

/**
 * Project options.
 *
 * NOTE: erp-api has no Projects master endpoint (projects/cost-centers are stored as
 * free-text IDs on payroll records — confirmed by audit, no backend list exists). Until a
 * master is added, options are derived from the project IDs already used on existing project
 * allocations + casual-labour records, so users can re-select known projects. The backing
 * combobox still accepts a typed value, so brand-new IDs remain enterable.
 */
export function useProjectOptions(): OptionsResult {
  const alloc = useProjectAllocations({ limit: 500 });
  const casual = useCasualLabor({ limit: 500 });
  const options = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of normalizeList<ProjectAllocation>(alloc.data).results) {
      const id = a.project_id ? String(a.project_id) : "";
      if (id) map.set(id, a.project_name ? `${a.project_name} (${id})` : id);
    }
    for (const c of normalizeList<CasualLabor>(casual.data).results) {
      const id = c.project_id ? String(c.project_id) : "";
      if (id && !map.has(id)) map.set(id, id);
    }
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [alloc.data, casual.data]);
  return { options, isLoading: alloc.isLoading || casual.isLoading };
}

/**
 * Cost-center options.
 *
 * NOTE: erp-api has no Cost-Centers master endpoint (gap — same as projects). Options are
 * derived from cost_center_id values already present on project allocations + casual-labour
 * records. The combobox still accepts typed values for new cost centers.
 */
export function useCostCenterOptions(): OptionsResult {
  const alloc = useProjectAllocations({ limit: 500 });
  const casual = useCasualLabor({ limit: 500 });
  const options = useMemo(() => {
    const set = new Set<string>();
    for (const a of normalizeList<ProjectAllocation>(alloc.data).results) {
      if (a.cost_center_id) set.add(String(a.cost_center_id));
    }
    for (const c of normalizeList<CasualLabor>(casual.data).results) {
      if (c.cost_center_id) set.add(String(c.cost_center_id));
    }
    return Array.from(set, (value) => ({ value, label: value }));
  }, [alloc.data, casual.data]);
  return { options, isLoading: alloc.isLoading || casual.isLoading };
}
