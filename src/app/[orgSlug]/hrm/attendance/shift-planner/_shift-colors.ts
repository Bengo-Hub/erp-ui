/** Deterministic, light-theme color palette for shift chips + legend.
 *
 *  Tenant-branding-aware where it matters (the page chrome uses semantic tokens);
 *  individual shifts need *distinguishable* hues, so we map each shift id to a
 *  fixed slot in a curated, accessible palette. */

export interface ShiftColor {
  /** Chip background. */
  bg: string;
  /** Chip text. */
  text: string;
  /** Chip / legend border. */
  border: string;
  /** Solid swatch (legend dot, row-fill button). */
  dot: string;
}

const PALETTE: ShiftColor[] = [
  { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200", dot: "bg-sky-500" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200", dot: "bg-violet-500" },
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200", dot: "bg-cyan-500" },
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-500" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", dot: "bg-indigo-500" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", dot: "bg-teal-500" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-800", border: "border-fuchsia-200", dot: "bg-fuchsia-500" },
];

/** Explicit off-duty styling (distinct from "no assignment"). */
export const OFF_COLOR: ShiftColor = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  border: "border-border",
  dot: "bg-muted-foreground/50",
};

/** Map a shift id to a stable palette slot via a tiny hash, so colors stay put
 *  across renders and weeks regardless of list ordering. */
export function shiftColor(shiftId: string | number | null | undefined): ShiftColor {
  if (shiftId == null || shiftId === "") return OFF_COLOR;
  const s = String(shiftId);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
