"use client";

import { notFound } from "next/navigation";

import { ReportRunner } from "@/components/reports/report-runner";
import { getReportConfig } from "@/lib/reports-config";

/** Thin client wrapper: resolves a report config by key → ReportRunner. */
export function ReportPage({ reportKey }: { reportKey: string }) {
  const config = getReportConfig(reportKey);
  if (!config) notFound();
  return <ReportRunner config={config} />;
}
