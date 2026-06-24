"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";

export interface CrudFieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "switch" | "date";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  step?: string;
  /** Full-width in the grid. */
  span2?: boolean;
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
          <Button variant="ghost" size="icon" onClick={() => open(row)} aria-label={`Edit ${entityLabel}`} title={`Edit ${entityLabel}`}>
            <Pencil className="size-4" />
          </Button>
        </PermissionGate>
        <PermissionGate permission={perms?.delete}>
          <Button variant="ghost" size="icon" onClick={() => setToDelete(row)} aria-label={`Delete ${entityLabel}`} title={`Delete ${entityLabel}`}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
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
          {fields.map((f) => {
            const val = values[f.name];
            const common = { id: f.name };
            return (
              <Field
                key={f.name}
                label={f.label}
                htmlFor={f.name}
                required={f.required}
                className={f.span2 ? "sm:col-span-2" : undefined}
              >
                {f.type === "textarea" ? (
                  <Textarea
                    {...common}
                    value={String(val ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    {...common}
                    value={String(val ?? "")}
                    onChange={(e) => setField(f.name, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : f.type === "switch" ? (
                  <Switch checked={!!val} onChange={(c) => setField(f.name, c)} id={f.name} />
                ) : (
                  <Input
                    {...common}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    step={f.step}
                    value={String(val ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                )}
              </Field>
            );
          })}
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
