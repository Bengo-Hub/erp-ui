"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useLeaveLogs } from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveLog } from "@/lib/api/leave";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

export default function LeaveLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined }),
    [page, debounced],
  );
  const { data, isLoading, error, refetch } = useLeaveLogs(params);
  const { results, count } = normalizeList<LeaveLog>(data);

  const columns: Column<LeaveLog>[] = [
    {
      header: "Employee",
      cell: (l) => <span className="font-medium">{l.employee_name || l.employee || "—"}</span>,
    },
    { header: "Action", cell: (l) => l.action || "—" },
    { header: "Description", cell: (l) => l.description || "—" },
    { header: "Date", cell: (l) => formatDate(l.created_at) },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Leave Logs" subtitle="Audit trail of leave activity" />
      <Card>
        <div className="border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search…"
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(l) => l.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No leave logs"
          emptyDescription="Leave activity will be recorded here."
        />
        {results.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
