"use client";

import { Badge } from "@/components/ui/base";

/** Map a free-form workflow status string to a Badge variant. */
export function statusVariant(status?: string): "success" | "warning" | "error" | "default" | "secondary" {
  const s = (status || "").toLowerCase();
  if (/(approv|complet|finaliz|active|hired|paid|closed|done)/.test(s)) return "success";
  if (/(reject|cancel|fail|expir|terminat)/.test(s)) return "error";
  if (/(pending|draft|submit|progress|review|screening|interview|open|trial)/.test(s)) return "warning";
  return "secondary";
}

/** Status pill with consistent colour mapping across HRM workflows. */
export function StatusBadge({ status }: { status?: string }) {
  return <Badge variant={statusVariant(status)}>{status || "—"}</Badge>;
}
