"use client";

import { Download, Info } from "lucide-react";

import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useBackups } from "@/hooks/use-security";
import { backupsApi, type Backup } from "@/lib/api/security";
import { normalizeList } from "@/lib/api/drf";
import { formatDateTime } from "@/lib/format";

import { UsersTabs } from "../../users/_tabs";

/**
 * Platform database backups. auth-api proxies a read-only manifest from the
 * backup server (GET /admin/backups) and streams files for download. There is
 * no create/delete/restore/schedule API — those are infra-managed CronJobs
 * (reported), so this page lists + downloads only and is platform-admin gated by
 * the API (non-admins get 403).
 */
export default function BackupsPage() {
  const { data, isLoading, error, refetch } = useBackups();
  // Manifest shape: { backups: [...] }; normalizeList tolerates both envelopes.
  const backups = normalizeList<Backup>(
    Array.isArray(data?.backups) ? data?.backups : (data as unknown as Backup[] | undefined),
  ).results;

  const download = (filename: string) => {
    const a = document.createElement("a");
    a.href = backupsApi.downloadUrl(filename);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const columns: Column<Backup>[] = [
    { header: "File", cell: (b) => <span className="font-medium">{b.filename}</span> },
    { header: "Size", cell: (b) => (b.size ? String(b.size) : "—") },
    {
      header: "Created",
      cell: (b) => (b.created_at ? formatDateTime(new Date(b.created_at * 1000).toISOString()) : "—"),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" aria-label="Download" onClick={() => download(b.filename)}>
            <Download className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Backups" subtitle="Platform database backups (read-only)" />
      <UsersTabs active="backups" />

      <Card className="flex items-start gap-3 border-dashed bg-muted/30 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Backups are generated automatically by infrastructure CronJobs. This view (platform
          admins only) lists available snapshots and lets you download them. Creating, deleting,
          restoring and scheduling are managed by infrastructure, not this UI.
        </p>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={backups}
          rowKey={(b) => b.filename}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No backups available"
          emptyDescription="No backup snapshots were found, or you lack platform-admin access."
        />
      </Card>
    </div>
  );
}
