"use client";

import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useReport, useReportExport } from "@/hooks/use-reports";
import { type ReportParams, type ReportRow } from "@/lib/api/reports";
import { type ReportColumn, type ReportConfig, type ReportFilterKey } from "@/lib/reports-config";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ReportFilters, type ReportFilterValues } from "./report-filters";

function renderCell(col: ReportColumn, row: ReportRow) {
  const v = row[col.field];
  if (col.money) return formatCurrency(v as string | number | null);
  if (col.percent) return formatPercent(v as string | number | null);
  return v == null || v === "" ? "—" : String(v);
}

function sum(rows: ReportRow[], field: string): number {
  return rows.reduce((acc, r) => acc + (parseFloat(String(r[field] ?? "")) || 0), 0);
}

/** Map filter values → API params (only for shown filters). */
function toParams(show: ReportFilterKey[], v: ReportFilterValues): ReportParams {
  const p: ReportParams = {};
  if (show.includes("year") && v.year) p.year = v.year;
  if (show.includes("month") && v.month) p.month = v.month;
  if (show.includes("department") && v.department) p.department_id = v.department;
  if (show.includes("region") && v.region) p.region_id = v.region;
  if (show.includes("employee") && v.employee) p.employee_id = v.employee;
  if (show.includes("dateRange")) {
    if (v.from_date) p.from_date = v.from_date;
    if (v.to_date) p.to_date = v.to_date;
  }
  return p;
}

/**
 * The single, config-driven report engine. Every statutory/payroll report
 * renders through this — there are no per-report page bodies.
 */
export function ReportRunner({ config }: { config: ReportConfig }) {
  const [values, setValues] = useState<ReportFilterValues>({
    year: String(new Date().getFullYear()),
  });
  const [enabled, setEnabled] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);

  const params = useMemo(() => toParams(config.filters, values), [config.filters, values]);
  const { rows, summary, isFetching, error, refetch } = useReport(config, params, enabled);
  const exporter = useReportExport(config, params);

  const generate = () => {
    const need = (config.required ?? []).find((k) => {
      const map: Record<string, string | undefined> = {
        year: values.year,
        month: values.month,
        department: values.department,
        employee: values.employee,
      };
      return !map[k];
    });
    if (need) {
      setMissing(`Please select ${need}.`);
      return;
    }
    setMissing(null);
    setEnabled(true);
    if (enabled) refetch();
  };

  const clear = () => {
    setEnabled(false);
    setMissing(null);
    setValues({ year: String(new Date().getFullYear()) });
  };

  const columns: Column<ReportRow>[] = useMemo(
    () =>
      config.columns.map((c) => ({
        header: c.header,
        headerClassName: c.money || c.numeric || c.percent ? "text-right" : undefined,
        className: c.money || c.numeric || c.percent ? "text-right tabular-nums" : undefined,
        cell: (row: ReportRow) => renderCell(c, row),
      })),
    [config.columns],
  );

  const tiles = useMemo(
    () =>
      (config.summary ?? []).map((s) => ({
        label: s.label,
        value: s.money ? formatCurrency(sum(rows, s.field)) : String(sum(rows, s.field)),
      })),
    [config.summary, rows],
  );

  const hasData = enabled && rows.length > 0;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={config.title}
        subtitle={config.description}
        actions={
          hasData ? (
            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 size-4" /> Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exporter.mutate("pdf")}
                disabled={exporter.isPending}
              >
                <FileDown className="mr-1.5 size-4" /> PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exporter.mutate("excel")}
                disabled={exporter.isPending}
              >
                <FileSpreadsheet className="mr-1.5 size-4" /> Excel
              </Button>
            </div>
          ) : undefined
        }
      />

      <ReportFilters
        show={config.filters}
        values={values}
        onChange={setValues}
        onGenerate={generate}
        onClear={clear}
        loading={isFetching}
      />
      {missing && <p className="text-sm text-destructive">{missing}</p>}

      {tiles.length > 0 && hasData && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <Card key={t.label} className="p-4 text-center">
              <p className="text-lg font-bold text-foreground">{t.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <DataTable
          columns={columns}
          rows={enabled ? rows : []}
          rowKey={(_r) => rows.indexOf(_r)}
          isLoading={enabled && isFetching}
          error={enabled ? error : undefined}
          onRetry={refetch}
          emptyTitle={enabled ? "No data for these filters" : "Select filters and generate"}
          emptyDescription={
            enabled
              ? "Try a different period or scope."
              : "Choose a period above, then press Generate to run this report."
          }
        />
      </Card>
    </div>
  );
}
