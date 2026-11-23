"use client";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

/** Segmented status filter shared by the correction and overtime request pages. */
export function RequestStatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Status" className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-9 rounded-md px-3 text-sm font-medium",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
