"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useDeleteDepartment, useDepartments, useSaveDepartment } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Department } from "@/lib/api/hrm-settings";
import { useHrmSettingsTabs } from "../_tabs";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "code", label: "Code" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function DepartmentsPage() {
  const { tabs, active, onChange } = useHrmSettingsTabs("departments");
  const { data, isLoading, error, refetch } = useDepartments();
  const save = useSaveDepartment();
  const del = useDeleteDepartment();
  const rows = normalizeList<Department>(data).results;

  const columns: Column<Department>[] = [
    { header: "Name", cell: (d) => <span className="font-medium">{d.name}</span> },
    { header: "Code", cell: (d) => d.code || "—" },
    { header: "Description", cell: (d) => d.description || "—" },
    {
      header: "Status",
      cell: (d) => (
        <Badge variant={d.is_active === false ? "secondary" : "success"}>
          {d.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
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
        entityLabel="Department"
        perms={{ add: "add_employee", change: "change_employee", delete: "delete_employee" }}
        toForm={(d) => ({ name: d?.name ?? "", code: d?.code ?? "", description: d?.description ?? "" })}
        onSave={({ id, data }, done) => save.mutate({ id, data }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
