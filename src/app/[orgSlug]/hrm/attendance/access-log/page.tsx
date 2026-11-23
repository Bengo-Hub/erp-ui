"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { LogFilters, type LogRange } from "@/components/attendance/log-filters";
import { Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useAccessEvents } from "@/hooks/use-attendance-devices";
import { type AccessEvent } from "@/lib/api/attendance-devices";
import { daysAgo, isoDay } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

function Result({ result }: { result: AccessEvent["result"] }) {
  const granted = result === "granted";
  const Icon = granted ? ShieldCheck : ShieldAlert;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <Icon className={granted ? "size-4 text-green-600" : "size-4 text-destructive"} aria-hidden />
      {granted ? "Granted" : "Denied"}
    </span>
  );
}

/** Door events from access-control devices: who opened which door, and every refused attempt. */
export default function AccessLogPage() {
  const [range, setRange] = useState<LogRange>({ from: daysAgo(6), to: isoDay(), device_id: "" });
  const [result, setResult] = useState<"" | "granted" | "denied">("");
  const [door, setDoor] = useState("");
  const [doorQuery, setDoorQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useAccessEvents({
    from: range.from,
    to: range.to,
    device_id: range.device_id || undefined,
    result: result || undefined,
    door: doorQuery || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<AccessEvent>[] = [
    { header: "Time", cell: (e) => <span className="tabular-nums">{formatDateTime(e.occurred_at)}</span> },
    { header: "Result", cell: (e) => <Result result={e.result} /> },
    {
      header: "Person",
      cell: (e) => e.employee_name || <span className="text-muted-foreground">Unknown PIN {e.device_pin ?? ""}</span>,
    },
    { header: "Door", cell: (e) => e.door || "—" },
    { header: "Device", cell: (e) => e.device_name || "—" },
    { header: "Verified by", cell: (e) => <span className="capitalize">{e.verify_mode || "—"}</span> },
    { header: "Reason", cell: (e) => <span className="text-xs text-muted-foreground">{e.reason || "—"}</span> },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Access log" subtitle="Door events from access-control devices" />
      <LogFilters
        value={range}
        onChange={(v) => {
          setPage(1);
          setRange(v);
        }}
      >
        <Field label="Result" htmlFor="access-result" className="w-36">
          <Select
            id="access-result"
            value={result}
            onChange={(e) => {
              setPage(1);
              setResult(e.target.value as typeof result);
            }}
          >
            <option value="">All</option>
            <option value="granted">Granted</option>
            <option value="denied">Denied</option>
          </Select>
        </Field>
        <Field label="Door" htmlFor="access-door" help="Press Enter to search" className="w-44">
          <Input
            id="access-door"
            value={door}
            placeholder="Any door"
            onChange={(e) => setDoor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setDoorQuery(door.trim());
              }
            }}
          />
        </Field>
      </LogFilters>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          ariaLabel="Access events"
          emptyTitle="No door events in this range"
          emptyDescription="Events appear once a device in door access mode is registered and online."
        />
        {total > PAGE_SIZE && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
