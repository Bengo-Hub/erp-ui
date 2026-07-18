"use client";

import { PdfPreview, useDocumentPreview } from "@bengo-hub/shared-ui-lib/documents";
import { Eye, FilePlus2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Select } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { LoadingState } from "@/components/ui/states";
import {
  useContractTerms,
  useGenerateContract,
  useSaveContractTerms,
} from "@/hooks/use-employees";
import { employeesApi } from "@/lib/api/employees";

const CONTRACT_TYPES = [
  { value: "director", label: "Director" },
  { value: "shareholder", label: "Shareholder" },
  { value: "director_shareholder", label: "Director & Shareholder" },
  { value: "permanent", label: "Permanent" },
  { value: "contractor", label: "Contractor" },
  { value: "casual", label: "Casual" },
  { value: "internship", label: "Internship" },
];

/** Maps the employee's employment_type onto a sensible default contract type. */
function defaultContractType(employmentType?: string): string {
  switch (employmentType) {
    case "permanent":
      return "permanent";
    case "contract":
    case "consultant":
      return "contractor";
    case "casual":
      return "casual";
    case "intern":
      return "internship";
    default:
      return "permanent";
  }
}

export function ContractTab({
  employeeId,
  employmentType,
}: {
  employeeId: number | string;
  employmentType?: string;
}) {
  const [type, setType] = useState(() => defaultContractType(employmentType));
  const [html, setHtml] = useState("");
  const [dirty, setDirty] = useState(false);
  // A pending type-switch awaiting confirmation because there are unsaved edits.
  const [pendingType, setPendingType] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useContractTerms(employeeId, type);
  const saveTerms = useSaveContractTerms(employeeId);
  const generate = useGenerateContract(employeeId);
  const { openPreview, previewProps } = useDocumentPreview({ onError: (m) => toast.error(m) });

  // Load the fetched terms into the editor whenever new terms arrive for the
  // active type, unless the user has unsaved edits (guarded by the confirm flow).
  useEffect(() => {
    if (data && !dirty) setHtml(data.terms_html ?? "");
  }, [data, dirty]);

  const requestTypeChange = (next: string) => {
    if (next === type) return;
    if (dirty) {
      setPendingType(next);
      return;
    }
    setType(next);
  };

  const confirmTypeChange = () => {
    if (pendingType == null) return;
    setDirty(false);
    setType(pendingType);
    setPendingType(null);
  };

  const onEditorChange = (next: string) => {
    setHtml(next);
    setDirty(true);
  };

  const save = () => saveTerms.mutate(html, { onSuccess: () => setDirty(false) });

  const preview = () =>
    openPreview(() => employeesApi.getContractPdf(employeeId).then((r) => r.blob), {
      fileName: `contract_${employeeId}.pdf`,
      title: "Employment Contract",
    });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Employment Contract</h3>
          <p className="text-xs text-muted-foreground">
            Edit the terms, preview the rendered PDF, then generate &amp; attach it to Documents.
          </p>
        </div>
        <div className="w-56">
          <Field label="Contract type">
            <Select value={type} onChange={(e) => requestTypeChange(e.target.value)}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Could not load contract terms.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <PermissionGate
            permission="change_employee"
            fallback={
              <div
                className="prose-editor rounded-lg border border-border p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            }
          >
            <RichTextEditor
              value={html}
              onChange={onEditorChange}
              disabled={isFetching}
              placeholder="Contract terms…"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={save} disabled={saveTerms.isPending || isFetching}>
                <Save className="mr-1.5 size-4" />
                {saveTerms.isPending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={preview}>
                <Eye className="mr-1.5 size-4" /> Preview PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                <FilePlus2 className="mr-1.5 size-4" />
                {generate.isPending ? "Generating…" : "Generate & attach"}
              </Button>
              {dirty && (
                <span className="text-xs text-muted-foreground">Unsaved changes</span>
              )}
            </div>
          </PermissionGate>
        )}
      </div>

      <ConfirmDialog
        open={pendingType != null}
        title="Discard unsaved changes?"
        description="Switching the contract type will reload the default terms for that type and discard your unsaved edits."
        confirmLabel="Switch type"
        onCancel={() => setPendingType(null)}
        onConfirm={confirmTypeChange}
      />

      <PdfPreview {...previewProps} />
    </Card>
  );
}
