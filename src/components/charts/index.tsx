"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/states";

/**
 * Lazy chart entrypoint. `recharts` (~heavy) is code-split out of the main
 * bundle and only fetched when a dashboard that actually renders a chart mounts.
 * `ChartCard` and the `ChartDatum` type stay static (no recharts dependency).
 */
export { ChartCard, type ChartDatum } from "./charts";

const ChartFallback = () => <Skeleton className="h-full w-full" />;

// Turbopack requires next/dynamic options to be an inline object literal.
export const TrendChart = dynamic(() => import("./charts").then((m) => m.TrendChart), {
  ssr: false,
  loading: ChartFallback,
});
export const BarChart = dynamic(() => import("./charts").then((m) => m.BarChart), {
  ssr: false,
  loading: ChartFallback,
});
export const BreakdownChart = dynamic(() => import("./charts").then((m) => m.BreakdownChart), {
  ssr: false,
  loading: ChartFallback,
});
