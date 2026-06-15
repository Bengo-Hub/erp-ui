"use client";

import { Download, Info, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateBackup, useDeleteBackup, useDownloadBackup, useErpBackups } from "@/hooks/use-backups";
import { type ErpBackup } from "@/lib/api/backups";
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
  const backups = data?.backups ?? [];
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
            aria-label="Download"
            disabled={download.isPending}
            onClick={() => download.mutate(b.name)}
          >
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(b)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
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
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create backup"}
          </Button>
        }
      />
      <UsersTabs active="backups" />

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
