"use client";

import { Building2, Network, Store } from "lucide-react";
import { useMemo, useState } from "react";

import { OrgChart, buildTree, type OrgNode } from "@/components/org-chart/tree";
import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useEmployees } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { relationLabel } from "@/lib/hrm";
import { cn } from "@/lib/utils";

type View = "org" | "branch";

const NO_OUTLET = "__no_outlet__";

interface Branch {
  key: string;
  label: string;
  employees: Employee[];
}

/** Group employees by outlet; no-outlet staff fall under an "Org-wide / HQ" bucket. */
function groupByOutlet(employees: Employee[]): Branch[] {
  const groups = new Map<string, Branch>();
  for (const e of employees) {
    const id = (e.outlet_id ?? e.outlet ?? "") as string;
    const key = id && String(id).trim() ? String(id) : NO_OUTLET;
    const label =
      key === NO_OUTLET
        ? "Org-wide / HQ"
        : relationLabel(undefined, (e.outlet as string) ?? undefined) !== "—"
          ? (e.outlet as string)
          : `Branch ${String(id)}`;
    if (!groups.has(key)) groups.set(key, { key, label, employees: [] });
    groups.get(key)!.employees.push(e);
  }
  // HQ bucket last; named branches alphabetically.
  return [...groups.values()].sort((a, b) => {
    if (a.key === NO_OUTLET) return 1;
    if (b.key === NO_OUTLET) return -1;
    return a.label.localeCompare(b.label);
  });
}

function totalPeople(roots: OrgNode[]): number {
  let n = 0;
  const walk = (nodes: OrgNode[]) => {
    for (const node of nodes) {
      n += 1;
      walk(node.reports);
    }
  };
  walk(roots);
  return n;
}

/** Segmented control for the org / branch view toggle. */
function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: typeof Network }[] = [
    { id: "org", label: "Whole organization", icon: Network },
    { id: "branch", label: "By branch / outlet", icon: Store },
  ];
  return (
    <div
      role="tablist"
      aria-label="Org chart view"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1"
    >
      {tabs.map((t) => {
        const active = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function OrgChartPage() {
  const { data, isLoading, error, refetch } = useEmployees({ page_size: 500 });
  const employees = useMemo(() => normalizeList<Employee>(data).results, [data]);

  const [view, setView] = useState<View>("org");

  const orgTree = useMemo(() => buildTree(employees), [employees]);
  const branches = useMemo(
    () =>
      groupByOutlet(employees).map((b) => ({
        ...b,
        tree: buildTree(b.employees),
      })),
    [employees],
  );

  const multiBranch = branches.length > 1;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Org Chart"
        subtitle="Reporting structure across the organization"
        actions={
          employees.length ? <ViewToggle value={view} onChange={setView} /> : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading org chart…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !employees.length ? (
        <Card className="p-6">
          <EmptyState
            icon={<Building2 className="size-6" />}
            title="No employees yet"
            description="Add staff with reporting lines to see the organization chart."
          />
        </Card>
      ) : view === "branch" ? (
        <div className="space-y-4">
          {!multiBranch && (
            <p className="text-xs text-muted-foreground">
              All staff share a single location — branch view mirrors the whole organization.
            </p>
          )}
          {branches.map((b) => (
            <Card key={b.key} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/5 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {b.key === NO_OUTLET ? (
                    <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <Store className="size-4 shrink-0 text-primary" aria-hidden />
                  )}
                  <h2 className="truncate text-sm font-semibold text-foreground">{b.label}</h2>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {b.employees.length} {b.employees.length === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="p-2">
                <OrgChart roots={b.tree} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Whole organization</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalPeople(orgTree)} {totalPeople(orgTree) === 1 ? "person" : "people"}
            </span>
          </div>
          <div className="p-2">
            <OrgChart roots={orgTree} />
          </div>
        </Card>
      )}
    </div>
  );
}
