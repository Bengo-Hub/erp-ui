"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { IconButton } from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface FieldOption {
  value: string;
  label: string;
}

export interface CrudFieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "switch" | "date" | "combobox" | "richtext";
  options?: FieldOption[];
  /**
   * Hook supplying `{options,isLoading}` for a `combobox`/`select` field
   * (e.g. `useEmployeeOptions`). Called once per render — must obey the rules of hooks.
   */
  optionsHook?: () => { options: FieldOption[]; isLoading?: boolean };
  required?: boolean;
  placeholder?: string;
  step?: string;
  /** Full-width in the grid. */
  span2?: boolean;
  /**
   * Escape hatch: render a fully custom control. Receives the field def, current value
   * and a setter. When provided, it overrides `type`.
   */
  render?: (field: CrudFieldDef, value: unknown, onChange: (value: unknown) => void) => ReactNode;
}

/** Renders a single field's control (own component so `optionsHook` can be called as a hook). */
function CrudField({
  field,
  value,
  setField,
}: {
  field: CrudFieldDef;
  value: unknown;
  setField: (name: string, value: unknown) => void;
}) {
  const common = { id: field.name };
  // Hooks must run unconditionally — call the optionsHook every render (no-op default).
  const hookResult = field.optionsHook?.();
  const onChange = (v: unknown) => setField(field.name, v);

  if (field.render) return <>{field.render(field, value, onChange)}</>;

  if (field.type === "combobox") {
    const options = hookResult?.options ?? field.options ?? [];
    return (
      <Combobox
        id={field.name}
        value={String(value ?? "")}
        onChange={(v) => setField(field.name, v)}
        options={options}
        loading={hookResult?.isLoading}
        placeholder={field.placeholder ?? "Select…"}
      />
    );
  }

  if (field.type === "richtext") {
    return (
      <RichTextEditor
        id={field.name}
        value={String(value ?? "")}
        onChange={(html) => setField(field.name, html)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        {...common}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(e) => setField(field.name, e.target.value)}
      />
    );
  }

  if (field.type === "select") {
    const options = hookResult?.options ?? field.options ?? [];
    return (
      <Select
        {...common}
        value={String(value ?? "")}
        onChange={(e) => setField(field.name, e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "switch") {
    return <Switch checked={!!value} onChange={(c) => setField(field.name, c)} id={field.name} />;
  }

  return (
    <Input
      {...common}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      step={field.step}
      value={String(value ?? "")}
      placeholder={field.placeholder}
      onChange={(e) => setField(field.name, e.target.value)}
    />
  );
}

interface CrudManagerProps<T extends { id: number | string }> {
  rows: T[];
  columns: Column<T>[];
  fields: CrudFieldDef[];
  rowKey?: (row: T) => string | number;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  entityLabel: string;
  /** Permissions for add/change/delete (e.g. "add_department"). */
  perms?: { add?: string; change?: string; delete?: string };
  emptyDescription?: ReactNode;
  /** Build initial form values from an existing row (for edit). */
  toForm: (row?: T) => Record<string, unknown>;
  onSave: (args: { id?: number | string; data: Record<string, unknown> }, done: () => void) => void;
  onDelete: (id: number | string, done: () => void) => void;
  saving?: boolean;
  deleting?: boolean;
  /** Server-side pagination. When provided, a pager renders below the table so every row is
   *  reachable (backend list endpoints default to a 20-row page). */
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void };
}

/** Reusable list + dialog-form CRUD surface for simple named records. */
export function CrudManager<T extends { id: number | string }>({
  rows,
  columns,
  fields,
  rowKey = (r) => r.id,
  isLoading,
  error,
  onRetry,
  entityLabel,
  perms,
  emptyDescription,
  toForm,
  onSave,
  onDelete,
  saving,
  deleting,
  pagination,
}: CrudManagerProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [toDelete, setToDelete] = useState<T | null>(null);

  const open = (row?: T) => {
    setEditing(row ?? null);
    setValues(toForm(row));
    setDialogOpen(true);
  };

  const setField = (name: string, value: unknown) =>
    setValues((v) => ({ ...v, [name]: value }));

  const submit = () => {
    const missing = fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
    if (missing) return;
    onSave({ id: editing?.id, data: values }, () => setDialogOpen(false));
  };

  const actionColumn: Column<T> = {
    header: "",
    headerClassName: "text-right",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end gap-1">
        <PermissionGate permission={perms?.change}>
          <IconButton label={`Edit ${entityLabel}`} onClick={() => open(row)}>
            <Pencil className="size-4" />
          </IconButton>
        </PermissionGate>
        <PermissionGate permission={perms?.delete}>
          <IconButton label={`Delete ${entityLabel}`} onClick={() => setToDelete(row)}>
            <Trash2 className="size-4 text-destructive" />
          </IconButton>
        </PermissionGate>
      </div>
    ),
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">{entityLabel}s</h3>
        <PermissionGate permission={perms?.add}>
          <Button size="sm" onClick={() => open()}>
            <Plus className="mr-1.5 size-4" /> Add {entityLabel}
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={rows}
        rowKey={rowKey}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyTitle={`No ${entityLabel.toLowerCase()}s yet`}
        emptyDescription={emptyDescription}
      />

      {pagination && pagination.total > 0 && (
        <div className="border-t border-border p-3">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${editing ? "Edit" : "Add"} ${entityLabel}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              htmlFor={f.name}
              required={f.required}
              className={f.span2 ? "sm:col-span-2" : undefined}
            >
              <CrudField field={f} value={values[f.name]} setField={setField} />
            </Field>
          ))}
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${entityLabel.toLowerCase()}?`}
        description="This action cannot be undone."
        destructive
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && onDelete(toDelete.id, () => setToDelete(null))}
      />
    </Card>
  );
}
