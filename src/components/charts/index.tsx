"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/states";

/**
 * Lazy chart entrypoint. `recharts` is code-split out of the main bundle and only fetched when a
 * dashboard that actually renders a chart mounts. `ChartCard` and the data types live in a
 * recharts-free module so they stay static.
 */
export { ChartCard, type ChartDatum, type ChartTable } from "./chart-card";
export type { SeriesDef, SeriesRow } from "./series-charts";

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
export const MultiLineChart = dynamic(() => import("./series-charts").then((m) => m.MultiLineChart), {
  ssr: false,
  loading: ChartFallback,
});
export const GroupedBarChart = dynamic(() => import("./series-charts").then((m) => m.GroupedBarChart), {
  ssr: false,
  loading: ChartFallback,
});
