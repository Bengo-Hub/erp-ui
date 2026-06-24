"use client";

import { CalendarClock, Download, Info, Trash2 } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  useBackupSettings,
  useCreateBackup,
  useDeleteBackup,
  useDownloadBackup,
  useErpBackups,
  useUpdateBackupSettings,
} from "@/hooks/use-backups";
import { type ErpBackup } from "@/lib/api/backups";
import { normalizeList } from "@/lib/api/drf";
import { formatDateTime } from "@/lib/format";

import { UsersTabs } from "../../users/_tabs";

function humanSize(bytes: number): string {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

/**
 * Auto-backup schedule — OPT-IN per tenant. Disabled by default; nothing runs
 * automatically until the toggle is switched on here. Mirrors the per-service
 * BackupSetting (auto_enabled / schedule_hour / retention_days).
 */
function AutoBackupCard() {
  const { data, isLoading } = useBackupSettings();
  const save = useUpdateBackupSettings();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(2);
  const [retention, setRetention] = useState(4);

  // Sync local form state from the fetched settings without an effect (React's
  // "adjust state during render when a prop changes" pattern) — avoids the cascading
  // re-render that setState-in-useEffect causes.
  const [syncedData, setSyncedData] = useState<typeof data>(undefined);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setEnabled(data.auto_enabled);
    setHour(data.schedule_hour);
    setRetention(data.retention_days);
  }

  const dirty =
    !!data &&
    (enabled !== data.auto_enabled ||
      hour !== data.schedule_hour ||
      retention !== data.retention_days);

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Automatic backups</h3>
          <p className="text-xs text-muted-foreground">
            Off by default. When enabled, a backup of your organisation&apos;s data runs daily at
            the chosen hour and older backups are pruned automatically.
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          disabled={isLoading || save.isPending}
          id="auto-backup-toggle"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Daily backup time" htmlFor="backup-hour" help="Service-local time">
          <Select
            id="backup-hour"
            value={hour}
            disabled={!enabled || isLoading || save.isPending}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Retention (days)"
          htmlFor="backup-retention"
          help="Backups older than this are deleted"
        >
          <Input
            id="backup-retention"
            type="number"
            min={1}
            max={365}
            value={retention}
            disabled={!enabled || isLoading || save.isPending}
            onChange={(e) => setRetention(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <PermissionGate permission="backups.manage">
          <Button
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({
                auto_enabled: enabled,
                schedule_hour: hour,
                retention_days: retention,
              })
            }
          >
            {save.isPending ? "Saving…" : "Save schedule"}
          </Button>
        </PermissionGate>
      </div>
    </Card>
  );
}

/**
 * Tenant-scoped backups — a logical export of THIS tenant's own data (erp-api).
 * Each tenant only ever sees/downloads its own backups; this is NOT a platform-wide
 * database dump (those are infra disaster-recovery only, never exposed here).
 */
export default function BackupsPage() {
  const { data, isLoading, error, refetch } = useErpBackups();
  const create = useCreateBackup();
  const del = useDeleteBackup();
  const download = useDownloadBackup();
  const backups = normalizeList<ErpBackup>(data).results;
  const [toDelete, setToDelete] = useState<ErpBackup | null>(null);

  const columns: Column<ErpBackup>[] = [
    { header: "File", cell: (b) => <span className="font-medium">{b.name}</span> },
    { header: "Size", cell: (b) => humanSize(b.size) },
    { header: "Created", cell: (b) => (b.created_at ? formatDateTime(b.created_at) : "—") },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Download backup"
            title="Download backup"
            disabled={download.isPending}
            onClick={() => download.mutate(b.name)}
          >
            <Download className="size-4" />
          </Button>
          <PermissionGate permission="backups.manage">
            <Button variant="ghost" size="icon" aria-label="Delete backup" title="Delete backup" onClick={() => setToDelete(b)}>
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
        subtitle="Your organisation's data backups"
        actions={
          <PermissionGate permission="backups.manage">
            <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create backup"}
            </Button>
          </PermissionGate>
        }
      />
      <UsersTabs active="backups" />

      <AutoBackupCard />

      <Card className="flex items-start gap-3 border-dashed bg-muted/30 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          These backups contain only <span className="font-medium text-foreground">your organisation&apos;s</span> data
          and are visible only to you. Generate one any time and download it for safekeeping.
        </p>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={backups}
          rowKey={(b) => b.name}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No backups yet"
          emptyDescription="Click “Create backup” to generate your first export."
        />
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete backup?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        destructive
        loading={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.name, { onSuccess: () => setToDelete(null) })}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
