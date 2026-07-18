"use client";

import { Badge } from "@/components/ui/base";
import { type Employee } from "@/lib/api/employees";

/**
 * Renders "Director" / "Shareholder" status badges for an employee. A person may
 * be both, either, or neither (shareholder-only is valid). Renders nothing when
 * neither flag is set, so it slots cleanly next to existing status badges.
 */
export function GovernanceBadges({
  employee,
  className,
}: {
  employee: Pick<Employee, "is_director" | "is_shareholder">;
  className?: string;
}) {
  if (!employee.is_director && !employee.is_shareholder) return null;
  return (
    <span className={className ?? "inline-flex items-center gap-1"}>
      {employee.is_director && <Badge variant="default">Director</Badge>}
      {employee.is_shareholder && <Badge variant="warning">Shareholder</Badge>}
    </span>
  );
}
