"use client";

import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/base";
import { cn } from "@/lib/utils";

/** Compact KPI tile with an icon, value and label (+ optional trend). */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "text-primary",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** Signed percentage; rendered green/red. */
  trend?: number | null;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        {Icon && (
          <div className={cn("flex size-11 items-center justify-center rounded-xl bg-primary/10", accent)}>
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
          {trend != null && isFinite(trend) && (
            <p className={cn("text-[11px] font-semibold", trend >= 0 ? "text-green-600" : "text-red-600")}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
