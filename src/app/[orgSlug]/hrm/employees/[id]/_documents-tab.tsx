"use client";

import { PdfPreview, useDocumentPreview } from "@bengo-hub/shared-ui-lib/documents";
import { Eye, FileUp, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeDocuments, useUploadDocument } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { employeesApi, type EmployeeDocument } from "@/lib/api/employees";
import { formatDate } from "@/lib/utils";

const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "id_document", label: "ID Document" },
  { value: "certificate", label: "Certificate" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "kra_pin", label: "KRA PIN" },
  { value: "other", label: "Other" },
];

function typeLabel(v?: string): string {
  return DOCUMENT_TYPES.find((t) => t.value === v)?.label || v || "—";
}

export function DocumentsTab({ employeeId }: { employeeId: number | string }) {
  const { data, isLoading, error, refetch } = useEmployeeDocuments(employeeId);
  const upload = useUploadDocument(employeeId);
  const docs = normalizeList<EmployeeDocument>(data).results;

  // Preview-first flow — fetch the file as a Blob, then show it in the shared modal.
  const { openPreview, previewProps } = useDocumentPreview({ onError: (m) => toast.error(m) });
  const previewDoc = (doc: EmployeeDocument) => {
    const fileName = doc.file_name || `${doc.title || "document"}.pdf`;
    openPreview(
      () => employeesApi.getDocumentFile(employeeId, doc.id, fileName).then((r) => r.blob),
      { fileName, title: doc.title || "Document" },
    );
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setFile(null);
    setTitle("");
    setDocumentType(DOCUMENT_TYPES[0].value);
    if (inputRef.current) inputRef.current.value = "";
    setDialogOpen(true);
  };

  const submit = () => {
    if (!file || !title.trim()) return;
    upload.mutate(
      { file, title: title.trim(), document_type: documentType },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const columns: Column<EmployeeDocument>[] = [
    { header: "Title", cell: (d) => <span className="font-medium text-foreground">{d.title || d.file_name || "—"}</span> },
    { header: "Type", cell: (d) => <span className="capitalize">{typeLabel(d.document_type)}</span> },
    { header: "Date", cell: (d) => formatDate(d.created_at || d.uploaded_at) || "—" },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (d) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Preview document" onClick={() => previewDoc(d)}>
            <Eye className="size-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">Documents</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Upload Document
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={docs}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No documents"
        emptyDescription="Upload a contract, ID or certificate for this employee."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Upload Document"
        description="Attach a file to this employee's record."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={upload.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!file || !title.trim() || upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Signed employment contract" />
          </Field>
          <Field label="Document Type" required>
            <Select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="File" required>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-center hover:border-primary/50">
              <FileUp className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : "Click to choose a file"}
              </span>
              <span className="text-xs text-muted-foreground">PDF, image or document</span>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>
      </Dialog>

      <PdfPreview {...previewProps} />
    </Card>
  );
}
