"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteJobGroup, useJobGroups, useSaveJobGroup } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type JobGroup } from "@/lib/api/hrm-settings";
import { formatMoney } from "@/lib/utils";
import { useHrmSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "grade", label: "Grade" },
  { name: "min_salary", label: "Min Salary", type: "number", step: "0.01" },
  { name: "max_salary", label: "Max Salary", type: "number", step: "0.01" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function JobGroupsPage() {
  const { tabs, active, onChange } = useHrmSettingsTabs("job-groups");
  const { data, isLoading, error, refetch } = useJobGroups();
  const save = useSaveJobGroup();
  const del = useDeleteJobGroup();
  const rows = normalizeList<JobGroup>(data).results;

  const columns: Column<JobGroup>[] = [
    { header: "Name", cell: (g) => <span className="font-medium">{g.name}</span> },
    { header: "Grade", cell: (g) => g.grade || "—" },
    { header: "Min Salary", className: "text-right", headerClassName: "text-right", cell: (g) => formatMoney(g.min_salary) },
    { header: "Max Salary", className: "text-right", headerClassName: "text-right", cell: (g) => formatMoney(g.max_salary) },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Organization Structure" subtitle="Departments, job titles & job groups" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Job Group"
        perms={{ add: "add_employee", change: "change_employee", delete: "delete_employee" }}
        toForm={(g) => ({
          name: g?.name ?? "",
          grade: g?.grade ?? "",
          min_salary: g?.min_salary ?? "",
          max_salary: g?.max_salary ?? "",
          description: g?.description ?? "",
        })}
        onSave={({ id, data }, done) => save.mutate({ id, data }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
