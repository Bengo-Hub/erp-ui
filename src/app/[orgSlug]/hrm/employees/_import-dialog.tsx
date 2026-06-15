"use client";

import { Download, FileUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { useImportEmployees } from "@/hooks/use-employees";
import { type EmployeeImportResult } from "@/lib/api/employees";

// Columns the erp-api importer maps (employee_number/first_name/last_name required).
const TEMPLATE_HEADER =
  "employee_number,first_name,last_name,email,gender,national_id,pin_no,shif_or_nhif_number,nssf_no,residential_status";

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_HEADER + "\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employees-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Upload a CSV of employees to POST /hrm/employees/import (per-row results). */
export function ImportEmployeesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const importMut = useImportEmployees();

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!file) return;
    importMut.mutate(file, { onSuccess: (res) => setResult(res) });
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Import Employees"
      description="Upload a CSV file of employee records. Rows are validated and created independently."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close} disabled={importMut.isPending}>
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button size="sm" onClick={submit} disabled={!file || importMut.isPending}>
              {importMut.isPending ? "Uploading…" : "Upload"}
            </Button>
          )}
        </>
      }
    >
      {result ? (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <span className="font-medium">Total: {result.total}</span>
            <span className="text-success">Created: {result.created}</span>
            <span className={result.failed > 0 ? "text-destructive" : "text-muted-foreground"}>
              Failed: {result.failed}
            </span>
          </div>
          {result.failed > 0 && (
            <div className="max-h-64 overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Employee #</th>
                    <th className="p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results
                    .filter((r) => r.status === "error")
                    .map((r) => (
                      <tr key={r.row} className="border-t border-border">
                        <td className="p-2">{r.row}</td>
                        <td className="p-2">{r.employee_number || r.email || "—"}</td>
                        <td className="p-2 text-destructive">{r.error}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Download className="size-3.5" /> Download CSV template
          </button>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center hover:border-primary/50">
            <FileUp className="size-7 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {file ? file.name : "Click to choose a CSV file"}
            </span>
            <span className="text-xs text-muted-foreground">CSV up to 8 MB</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}
    </Dialog>
  );
}
