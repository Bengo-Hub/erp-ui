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

import { Card } from "@/components/ui/base";
import { EmptyState } from "@/components/ui/states";

const PALETTE = [
  "var(--tenant-primary, #2563eb)",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}

/** Card wrapper with a title and empty-state guard for charts. */
export function ChartCard({ title, children, empty }: ChartCardProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      {empty ? (
        <EmptyState title="No data yet" description="This chart will populate as data accrues." />
      ) : (
        <div className="h-64">{children}</div>
      )}
    </Card>
  );
}

export interface ChartDatum {
  label: string;
  value: number;
}

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
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_d, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
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
