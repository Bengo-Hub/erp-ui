"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** One plotted measure. `color` is a CSS colour, normally a `var(--series-n)` token. */
export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

/** Any row object; series keys name its numeric fields. */
export type SeriesRow = object;

const AXIS = { fontSize: 11 };
const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 },
};

/** Several measures over time on one axis, with a crosshair tooltip and a legend. */
export function MultiLineChart({
  data,
  xKey,
  series,
  formatX,
}: {
  data: SeriesRow[];
  xKey: string;
  series: SeriesDef[];
  formatX?: (v: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RLineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey={xKey}
          tick={AXIS}
          tickFormatter={formatX}
          stroke="currentColor"
          className="text-muted-foreground"
          minTickGap={24}
          tickLine={false}
        />
        <YAxis tick={AXIS} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
          labelFormatter={(v) => (formatX ? formatX(String(v)) : String(v))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            isAnimationActive={false}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}

/**
 * Horizontal grouped bars per category (e.g. late and absent per department). Horizontal so long
 * department names stay readable on a phone.
 */
export function GroupedBarChart({
  data,
  categoryKey,
  series,
}: {
  data: SeriesRow[];
  categoryKey: string;
  series: SeriesDef[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tick={AXIS} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey={categoryKey}
          tick={AXIS}
          width={96}
          stroke="currentColor"
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
