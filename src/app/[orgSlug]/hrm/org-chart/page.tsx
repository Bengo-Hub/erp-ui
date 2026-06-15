"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui/base";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployees } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { employeeName, relationLabel } from "@/lib/hrm";

interface Node {
  employee: Employee;
  reports: Node[];
}

/** Resolve a manager id from common field names. */
function managerId(e: Employee): number | string | null {
  const raw = (e.manager ?? e.reports_to ?? e.supervisor) as
    | number
    | string
    | { id: number | string }
    | null
    | undefined;
  if (raw == null) return null;
  return typeof raw === "object" ? raw.id : raw;
}

/** Build a reporting tree; employees with no/absent manager become roots. */
function buildTree(employees: Employee[]): Node[] {
  const byId = new Map<number | string, Node>();
  employees.forEach((e) => byId.set(e.id, { employee: e, reports: [] }));
  const roots: Node[] = [];
  employees.forEach((e) => {
    const mid = managerId(e);
    const parent = mid != null ? byId.get(mid) : undefined;
    if (parent && parent.employee.id !== e.id) parent.reports.push(byId.get(e.id)!);
    else roots.push(byId.get(e.id)!);
  });
  return roots;
}

function NodeRow({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const e = node.employee;
  const hasReports = node.reports.length > 0;
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/5"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={hasReports ? "text-muted-foreground" : "invisible"}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronRight className={`size-4 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {employeeName(e).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{employeeName(e)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {relationLabel(e.job_title, e.job_title_name)}
            {" · "}
            {relationLabel(e.department, e.department_name)}
          </p>
        </div>
        {hasReports && <Badge variant="outline">{node.reports.length}</Badge>}
      </div>
      {open && hasReports && (
        <div>
          {node.reports.map((r) => (
            <NodeRow key={r.employee.id} node={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { data, isLoading, error, refetch } = useEmployees({ page_size: 500 });
  const employees = useMemo(() => normalizeList<Employee>(data).results, [data]);
  const tree = useMemo(() => buildTree(employees), [employees]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Org Chart" subtitle="Reporting structure across the organization" />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !employees.length ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Building2 className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No employees yet — add staff to see the org chart.
          </p>
        </Card>
      ) : (
        <Card className="p-3">
          {tree.map((n) => (
            <NodeRow key={n.employee.id} node={n} depth={0} />
          ))}
        </Card>
      )}
    </div>
  );
}
