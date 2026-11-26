"use client";

import { useParams, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { InheritedBadge } from "@/components/settings/inherited-badge";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useAppraisalTemplates,
  useDeleteAppraisalTemplate,
  useRevertAppraisalTemplate,
  useSaveAppraisalTemplate,
} from "@/hooks/use-appraisals";
import { normalizeList } from "@/lib/api/drf";
import { type AppraisalTemplate } from "@/lib/api/appraisals";

const fields: CrudFieldDef[] = [
  { name: "name", label: "Template Name", required: true, span2: true },
  { name: "is_active", label: "Active", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function AppraisalTemplatesPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";
  const { data, isLoading, error, refetch } = useAppraisalTemplates();
  const save = useSaveAppraisalTemplate();
  const del = useDeleteAppraisalTemplate();
  const revert = useRevertAppraisalTemplate();
  const rows = normalizeList<AppraisalTemplate>(data).results;

  const columns: Column<AppraisalTemplate>[] = [
    {
      header: "Name",
      cell: (t) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{t.name || "—"}</span>
          <InheritedBadge inherited={t.inherited} customised={t.customised} />
        </div>
      ),
    },
    { header: "Questions", cell: (t) => t.question_count ?? "—" },
    {
      header: "Status",
      cell: (t) => (
        <Badge variant={t.is_active === false ? "secondary" : "success"}>
          {t.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Appraisal Templates" subtitle="Reusable question sets for appraisals" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Template"
        perms={{ add: "add_appraisaltemplate", change: "change_appraisaltemplate", delete: "delete_appraisaltemplate" }}
        emptyDescription="No appraisal templates yet."
        // A platform template keeps its name; its description and active flag can be customised.
        canDelete={(t) => !t.inherited}
        editTitle={(t) => (t.inherited ? `Customise ${t.name ?? "template"}` : "Edit Template")}
        rowActions={(t) =>
          t.customised ? (
            <PermissionGate permission="hrm.appraisal.manage">
              <IconButton label="Restore platform values" onClick={() => revert.mutate(t.id)} disabled={revert.isPending}>
                <RotateCcw className="size-4" />
              </IconButton>
            </PermissionGate>
          ) : null
        }
        toForm={(t) => ({
          name: t?.name ?? "",
          is_active: t?.is_active ?? true,
          description: t?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate({ id, data: data as Partial<AppraisalTemplate> }, { onSuccess: done })
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />

      <p className="text-center text-xs text-muted-foreground">
        Manage the questions within templates on the{" "}
        <button className="text-primary hover:underline" onClick={() => router.push(`/${orgSlug}/hrm/appraisals/questions`)}>
          questions page
        </button>
        .
      </p>
    </div>
  );
}
