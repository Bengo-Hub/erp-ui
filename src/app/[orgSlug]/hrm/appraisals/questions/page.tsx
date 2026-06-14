"use client";

import { useMemo, useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Card } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { Field, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  useAppraisalQuestions,
  useAppraisalTemplates,
  useDeleteAppraisalQuestion,
  useSaveAppraisalQuestion,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { type AppraisalQuestion, type AppraisalTemplate } from "@/lib/api/appraisals";

export default function AppraisalQuestionsPage() {
  const [template, setTemplate] = useState("");
  const { data: tplData } = useAppraisalTemplates({ page_size: 200 });
  const templates = normalizeList<AppraisalTemplate>(tplData).results;

  const params = useMemo(
    () => (template ? { template, page_size: 200 } : { page_size: 200 }),
    [template],
  );
  const { data, isLoading, error, refetch } = useAppraisalQuestions(params);
  const save = useSaveAppraisalQuestion();
  const del = useDeleteAppraisalQuestion();
  const rows = normalizeList<AppraisalQuestion>(data).results;

  const fields: CrudFieldDef[] = [
    {
      name: "template",
      label: "Template",
      type: "select",
      required: true,
      options: templates.map((t) => ({ value: String(t.id), label: t.name ?? `#${t.id}` })),
    },
    { name: "text", label: "Question", type: "textarea", required: true, span2: true },
    { name: "category", label: "Category" },
    { name: "weight", label: "Weight", type: "number", step: "0.1" },
    { name: "max_score", label: "Max Score", type: "number" },
    { name: "order", label: "Order", type: "number" },
  ];

  const columns: Column<AppraisalQuestion>[] = [
    { header: "Question", cell: (q) => <span className="font-medium">{q.text || q.question_text || "—"}</span> },
    { header: "Template", cell: (q) => q.template_name || templates.find((t) => t.id === q.template)?.name || "—" },
    { header: "Category", cell: (q) => q.category || "—" },
    { header: "Weight", cell: (q) => q.weight ?? "—" },
    { header: "Max", cell: (q) => q.max_score ?? "—" },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Appraisal Questions" subtitle="Questions that make up appraisal templates" />

      <Card>
        <div className="p-4">
          <Field label="Filter by Template" htmlFor="q-filter" className="max-w-xs">
            <Select id="q-filter" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">All templates</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Question"
        perms={{ add: "add_appraisalquestion", change: "change_appraisalquestion", delete: "delete_appraisalquestion" }}
        emptyDescription="No questions for this template yet."
        toForm={(q) => ({
          template: q?.template ?? template ?? "",
          text: q?.text ?? q?.question_text ?? "",
          category: q?.category ?? "",
          weight: q?.weight ?? "",
          max_score: q?.max_score ?? "",
          order: q?.order ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                ...data,
                template: data.template ? Number(data.template) : undefined,
              } as Partial<AppraisalQuestion>,
            },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
