"use client";

import { useMemo, useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useDeletePermission, usePermissions, useSavePermission } from "@/hooks/use-users";
import { normalizeList } from "@/lib/api/drf";
import { type Permission } from "@/lib/api/users";

import { UsersTabs } from "../_tabs";

function permModule(p: Permission): string {
  if (typeof p.module === "string") return p.module;
  if (p.content_type && typeof p.content_type === "object") return p.content_type.app_label ?? "";
  if (typeof p.content_type === "string") return p.content_type;
  return "—";
}

const fields: CrudFieldDef[] = [
  { name: "name", label: "Name", required: true, span2: true },
  { name: "codename", label: "Codename", required: true },
  { name: "module", label: "Module / App" },
];

export default function PermissionsPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const { data, isLoading, error, refetch } = usePermissions(
    debounced ? { search: debounced } : undefined,
  );
  const save = useSavePermission();
  const del = useDeletePermission();
  const rows = useMemo(() => normalizeList<Permission>(data).results, [data]);

  const columns: Column<Permission>[] = [
    { header: "Name", cell: (p) => <span className="font-medium">{p.name}</span> },
    { header: "Codename", cell: (p) => <code className="text-xs">{p.codename || "—"}</code> },
    { header: "Module", cell: (p) => <Badge variant="outline">{permModule(p)}</Badge> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Users & Security" subtitle="System permissions catalogue" />
      <UsersTabs active="permissions" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search permissions…"
        className="max-w-sm"
      />

      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Permission"
        perms={{ add: "add_permission", change: "change_permission", delete: "delete_permission" }}
        toForm={(p) => ({
          name: p?.name ?? "",
          codename: p?.codename ?? "",
          module: permModule(p ?? ({} as Permission)).replace("—", ""),
        })}
        onSave={({ id, data: d }, done) => save.mutate({ id, data: d }, { onSuccess: done })}
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
