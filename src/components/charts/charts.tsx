"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RLineChart,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { type ChartDatum } from "./chart-card";

// Categorical slots in a fixed order: identity follows the slot, never the rank.
const PALETTE = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];


/** Trend line chart. */
export function TrendChart({ data, color = PALETTE[0] }: { data: ChartDatum[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RLineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </RLineChart>
    </ResponsiveContainer>
  );
}

/** Vertical bar chart. */
export function BarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
        <Tooltip />
        {/* One measure, one colour: the axis label carries each bar's identity. */}
        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={PALETTE[0]} maxBarSize={40} />
      </RBarChart>
    </ResponsiveContainer>
  );
}

/** Donut breakdown chart. */
export function BreakdownChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RPieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_d, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RPieChart>
    </ResponsiveContainer>
  );
}
