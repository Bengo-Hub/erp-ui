"use client";

/**
 * Top-down org-chart tree renderer.
 *
 * Renders a reporting hierarchy as cards connected by vertical/horizontal
 * connector lines (CSS pseudo-elements via Tailwind), with collapsible
 * subtrees. Large trees overflow horizontally inside a scroll container.
 *
 * Light-theme tokens only (text-foreground, bg-card, border-border,
 * text-primary, bg-muted, …) — no hard-coded colours.
 */

import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/base";
import { type Employee } from "@/lib/api/employees";
import { employeeName, relationLabel } from "@/lib/hrm";
import { cn } from "@/lib/utils";

export interface OrgNode {
  employee: Employee;
  reports: OrgNode[];
}

/** Resolve a manager id from common field names (mirrors `reports_to_id`). */
export function managerId(e: Employee): number | string | null {
  const raw = (e.manager ?? e.reports_to ?? e.supervisor) as
    | number
    | string
    | { id: number | string }
    | null
    | undefined;
  if (raw == null) return null;
  return typeof raw === "object" ? raw.id : raw;
}

/** Build a reporting forest; employees with no/absent/unknown manager become roots. */
export function buildTree(employees: Employee[]): OrgNode[] {
  const byId = new Map<number | string, OrgNode>();
  employees.forEach((e) => byId.set(e.id, { employee: e, reports: [] }));
  const roots: OrgNode[] = [];
  employees.forEach((e) => {
    const mid = managerId(e);
    const parent = mid != null ? byId.get(mid) : undefined;
    if (parent && parent.employee.id !== e.id) parent.reports.push(byId.get(e.id)!);
    else roots.push(byId.get(e.id)!);
  });
  // Stable, readable ordering: name-sorted at every level.
  const sortFn = (a: OrgNode, b: OrgNode) =>
    employeeName(a.employee).localeCompare(employeeName(b.employee));
  const sortDeep = (nodes: OrgNode[]) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => sortDeep(n.reports));
  };
  sortDeep(roots);
  return roots;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Single node card. */
function NodeCard({
  node,
  open,
  onToggle,
}: {
  node: OrgNode;
  open: boolean;
  onToggle: () => void;
}) {
  const e = node.employee;
  const directReports = node.reports.length;
  const dept = relationLabel(e.department, e.department_name);
  const title = relationLabel(e.job_title, e.job_title_name);
  const hasReports = directReports > 0;

  return (
    <div
      className={cn(
        "relative flex w-56 flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left shadow-sm",
        "transition-shadow hover:shadow-md",
        // Department/leader accent: a left bar from the primary token.
        hasReports && "border-l-4 border-l-primary",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials(employeeName(e))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={employeeName(e)}>
            {employeeName(e)}
          </p>
          {title !== "—" && (
            <p className="truncate text-xs text-muted-foreground" title={title}>
              {title}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {dept !== "—" ? (
          <Badge variant="secondary" className="max-w-full truncate">
            {dept}
          </Badge>
        ) : (
          <span />
        )}
        {hasReports && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Collapse direct reports" : "Expand direct reports"}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Users className="size-3" aria-hidden />
            {directReports}
            <ChevronDown
              className={cn("size-3 transition-transform", open ? "" : "-rotate-90")}
              aria-hidden
            />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Recursive subtree rendered as a classic top-down org chart.
 *
 * Connector lines are drawn purely with Tailwind utility classes (no scoped
 * CSS), using the standard nested-list technique:
 *  - every child `<li>` draws a half-width top border to its sibling +
 *    a short vertical stub up to the shared horizontal bus;
 *  - the parent draws a vertical stub down into that bus;
 *  - first/last children trim the horizontal bus so it spans only between the
 *    outermost siblings. A single child gets just a straight vertical line.
 */
function Subtree({
  node,
  depth,
  isRoot,
  isOnly,
}: {
  node: OrgNode;
  depth: number;
  /** Top-level node in the chart — no incoming connector. */
  isRoot?: boolean;
  /** This node is its parent's sole child — no horizontal bus, just a stub. */
  isOnly?: boolean;
}) {
  // Auto-expand the top two levels; collapse deeper to keep large trees legible.
  const [open, setOpen] = useState(depth < 2);
  const hasReports = node.reports.length > 0;
  const showChildren = open && hasReports;
  const childCount = node.reports.length;
  const drawIncoming = !isRoot;

  return (
    <li
      className={cn(
        "relative flex flex-col items-center px-3 pt-6",
        // Vertical stub rising from the horizontal bus into this node's top.
        drawIncoming &&
          "before:absolute before:left-1/2 before:top-0 before:h-6 before:w-px before:-translate-x-1/2 before:bg-border before:content-['']",
        // Horizontal bus: a top border running across the row of siblings,
        // trimmed to a half-width on the outermost children so it spans only
        // between the first and last sibling. A sole child draws no bus.
        drawIncoming &&
          !isOnly &&
          "after:absolute after:left-0 after:right-0 after:top-0 after:h-px after:bg-border after:content-['']",
        drawIncoming && !isOnly && "first:after:left-1/2 last:after:right-1/2",
      )}
    >
      <NodeCard node={node} open={open} onToggle={() => setOpen((o) => !o)} />

      {showChildren && (
        <>
          {/* Stub dropping from this node into the children's horizontal bus. */}
          <div className="h-6 w-px bg-border" aria-hidden />
          <ul className="relative flex items-start justify-center">
            {node.reports.map((child) => (
              <Subtree
                key={child.employee.id}
                node={child}
                depth={depth + 1}
                isOnly={childCount === 1}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

/** A horizontally-scrollable chart for one reporting forest. */
export function OrgChart({ roots }: { roots: OrgNode[] }) {
  if (!roots.length) return null;
  return (
    <div className="w-full overflow-x-auto pb-4">
      <ul className="inline-flex min-w-full items-start justify-center gap-6 px-4 pt-2">
        {roots.map((root) => (
          <Subtree key={root.employee.id} node={root} depth={0} isRoot />
        ))}
      </ul>
    </div>
  );
}
