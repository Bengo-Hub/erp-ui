"use client";

import { Badge } from "@/components/ui/base";

type StatusVariant = "success" | "warning" | "error" | "default" | "secondary";

/** Map a free-form workflow status string to a Badge variant. */
export function statusVariant(status?: string): StatusVariant {
  const s = (status || "").toLowerCase();
  if (/(approv|complet|finaliz|active|hired|paid|closed|done)/.test(s)) return "success";
  if (/(reject|cancel|fail|expir|terminat)/.test(s)) return "error";
  if (/(pending|draft|submit|progress|review|screening|interview|open|trial)/.test(s)) return "warning";
  return "secondary";
}

/**
 * Status pill with consistent colour mapping across HRM workflows. `labels` turns the API's
 * status key into plain English (the colour is chosen from the label when one is given, so
 * "completed" shown as "Awaiting review" stays amber).
 */
export function StatusBadge({ status, labels }: { status?: string; labels?: Record<string, string> }) {
  const label = (status && labels?.[status]) || status;
  return <Badge variant={statusVariant(label)}>{label || "—"}</Badge>;
}
