"use client";

import { useMemo } from "react";

import { useEmployees } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { employeeName } from "@/lib/hrm";

/** Employees as `{value,label}` options for form selects (first 500). */
export function useEmployeeOptions() {
  const { data, isLoading } = useEmployees({ page_size: 500 });
  const options = useMemo(
    () =>
      normalizeList<Employee>(data).results.map((e) => ({
        value: String(e.id),
        label: employeeName(e),
      })),
    [data],
  );
  return { options, isLoading };
}
