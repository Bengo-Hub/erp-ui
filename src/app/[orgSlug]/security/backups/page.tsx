"use client";

import { Download, History, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import {
  useBackupActions,
  useBackupSchedule,
  useBackups,
  useSaveBackupSchedule,
} from "@/hooks/use-security";
import { normalizeList } from "@/lib/api/drf";
import { type Backup } from "@/lib/api/security";

import { UsersTabs } from "../../users/_tabs";

const scheduleFields = [
  { name: "enabled", label: "Scheduled backups", type: "switch" as const, span2: true },
  {
    name: "frequency",
    label: "Frequency",
    type: "select" as const,
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
    ],
  },
  { name: "time", label: "Run at", type: "time" as const },
  { name: "retention_days", label: "Retention (days)", type: "number" as const },
];

function statusVariant(status?: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("complete") || s === "success") return "success" as const;
  if (s.includes("fail") || s.includes("error")) return "error" as const;
  if (s.includes("progress") || s.includes("running")) return "warning" as const;
  return "secondary" as const;
}

export default function BackupsPage() {
  const { data, isLoading, error, refetch } = useBackups();
  const { create, remove, restore, download } = useBackupActions();
  const schedule = useBackupSchedule();
  const saveSchedule = useSaveBackupSchedule();
  const backups = normalizeList<Backup>(data).results;

  const [toDelete, setToDelete] = useState<Backup | null>(null);
  const [toRestore, setToRestore] = useState<Backup | null>(null);

  const columns: Column<Backup>[] = [
    { header: "Name", cell: (b) => <span className="font-medium">{b.name || `Backup #${b.id}`}</span> },
    { header: "Type", cell: (b) => <span className="capitalize">{b.type || "—"}</span> },
    { header: "Size", cell: (b) => (b.size ? String(b.size) : "—") },
    { header: "Status", cell: (b) => <Badge variant={statusVariant(b.status)}>{b.status || "—"}</Badge> },
    { header: "Created", cell: (b) => (b.created_at ? new Date(b.created_at).toLocaleString() : "—") },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Download" onClick={() => download.mutate(b.id)}>
            <Download className="size-4" />
          </Button>
          <PermissionGate permission="change_backup">
            <Button variant="ghost" size="icon" aria-label="Restore" onClick={() => setToRestore(b)}>
              <History className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_backup">
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(b)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Backups"
        subtitle="Database backups & restore"
        actions={
          <PermissionGate permission="add_backup">
            <Button size="sm" onClick={() => create.mutate("full")} disabled={create.isPending}>
              <Plus className="mr-1.5 size-4" /> {create.isPending ? "Starting…" : "New Backup"}
            </Button>
          </PermissionGate>
        }
      />
      <UsersTabs active="backups" />

      <Card>
        <DataTable
          columns={columns}
          rows={backups}
          rowKey={(b) => b.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No backups yet"
          emptyDescription="Create a backup or configure a schedule below."
        />
      </Card>

      <PermissionGate permission="change_backup">
        <SettingsForm
          title="Backup schedule"
          description="Automate periodic database backups."
          data={schedule.data}
          isLoading={schedule.isLoading}
          error={schedule.error}
          onRetry={schedule.refetch}
          saving={saveSchedule.isPending}
          fields={scheduleFields}
          onSave={(v) => saveSchedule.mutate(v)}
        />
      </PermissionGate>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete backup?"
        description="This backup file will be permanently removed."
        destructive
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
      <ConfirmDialog
        open={!!toRestore}
        title="Restore from backup?"
        description="This will overwrite current data with the backup contents. Proceed with caution."
        destructive
        confirmLabel="Restore"
        loading={restore.isPending}
        onCancel={() => setToRestore(null)}
        onConfirm={() => toRestore && restore.mutate(toRestore.id, { onSuccess: () => setToRestore(null) })}
      />
    </div>
  );
}
