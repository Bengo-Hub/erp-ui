"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteJobTitle, useJobTitles, useSaveJobTitle } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type NamedRecord } from "@/lib/api/hrm-settings";
import { useHrmSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Title", required: true },
  { name: "code", label: "Code" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function JobTitlesPage() {
  const { tabs, active, onChange } = useHrmSettingsTabs("job-titles");
  const { data, isLoading, error, refetch } = useJobTitles();
  const save = useSaveJobTitle();
  const del = useDeleteJobTitle();
  const rows = normalizeList<NamedRecord>(data).results;

  const columns: Column<NamedRecord>[] = [
    { header: "Title", cell: (t) => <span className="font-medium">{t.name}</span> },
    { header: "Code", cell: (t) => t.code || "—" },
    { header: "Description", cell: (t) => t.description || "—" },
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
        entityLabel="Job Title"
        perms={{ add: "add_employee", change: "change_employee", delete: "delete_employee" }}
        toForm={(t) => ({ name: t?.name ?? "", code: t?.code ?? "", description: t?.description ?? "" })}
        onSave={({ id, data }, done) => save.mutate({ id, data }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
