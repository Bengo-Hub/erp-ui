"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import {
  normalizeReport,
  reportsApi,
  type ReportFormat,
  type ReportParams,
} from "@/lib/api/reports";
import { type ReportConfig } from "@/lib/reports-config";

/** Trigger a browser download for a fetched blob. */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Runs a report from its config. `params` are the resolved filter values;
 * the query only fires when `enabled` (user pressed Generate) so we don't
 * hammer the API on every filter keystroke.
 */
export function useReport(config: ReportConfig, params: ReportParams, enabled: boolean) {
  const merged = { ...config.staticParams, ...params };
  const query = useQuery({
    queryKey: ["reports", config.key, merged],
    queryFn: () => reportsApi.run(config.path, merged),
    enabled,
  });
  const { rows, summary } = normalizeReport(query.data);
  return { ...query, rows, summary };
}

/** Export a report to pdf/excel; streams + downloads the blob. */
export function useReportExport(config: ReportConfig, params: ReportParams) {
  return useMutation({
    mutationFn: (format: ReportFormat) =>
      reportsApi.export(config.exportType, format, { ...config.staticParams, ...params }),
    onSuccess: ({ blob, fileName }) => {
      downloadBlob(blob, fileName);
      toast.success("Report exported");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to export report")),
  });
}
