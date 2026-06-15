/** Shared HRM display helpers. */

import { type Employee } from "@/lib/api/employees";

/** Best-effort full name for an employee record. */
export function employeeName(e: Pick<Employee, "first_name" | "middle_name" | "last_name" | "email">): string {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : (e.email ?? "Unnamed employee");
}

/** Resolve a possibly-nested FK ({id,name}) or flat *_name field to a label. */
export function relationLabel(
  rel: number | string | { id: number | string; name: string } | null | undefined,
  flatName?: string,
): string {
  if (rel && typeof rel === "object" && "name" in rel) return rel.name;
  if (flatName) return flatName;
  return "—";
}

export const EMPLOYMENT_TYPES = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "casual", label: "Casual" },
  { value: "consultant", label: "Consultant" },
  { value: "intern", label: "Intern" },
];

export const PAGE_SIZE = 15;
