"use client";

import { FileUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { useImportEmployees } from "@/hooks/use-employees";

/** Upload a CSV/XLSX of employees to /hrm/employees/upload-employee-data/. */
export function ImportEmployeesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const importMut = useImportEmployees();

  const reset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (!file) return;
    importMut.mutate(file, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import Employees"
      description="Upload a CSV or Excel file with employee records."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={importMut.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!file || importMut.isPending}>
            {importMut.isPending ? "Uploading…" : "Upload"}
          </Button>
        </>
      }
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center hover:border-primary/50">
        <FileUp className="size-7 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {file ? file.name : "Click to choose a file"}
        </span>
        <span className="text-xs text-muted-foreground">CSV or XLSX up to 5 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </Dialog>
  );
}
