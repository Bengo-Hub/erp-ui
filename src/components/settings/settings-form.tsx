"use client";

import { useState, type ReactNode } from "react";

import { Button, Card } from "@/components/ui/base";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { ErrorState, LoadingState } from "@/components/ui/states";

export interface SettingsFieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "switch" | "select" | "time" | "date";
  options?: { value: string; label: string }[];
  help?: string;
  span2?: boolean;
  step?: string;
}

interface SettingsFormProps<T extends Record<string, unknown>> {
  title: string;
  description?: ReactNode;
  fields: SettingsFieldDef[];
  data: T | undefined;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  saving?: boolean;
  onSave: (values: Record<string, unknown>) => void;
  /** Permission-gated read-only mode (renders disabled controls). */
  readOnly?: boolean;
  footerNote?: ReactNode;
}

/**
 * Generic settings card: maps a record → labelled controls, dirty-tracks, and
 * saves the full value map. Used across Settings + Security config pages.
 */
export function SettingsForm<T extends Record<string, unknown>>({
  title,
  description,
  fields,
  data,
  isLoading,
  error,
  onRetry,
  saving,
  onSave,
  readOnly,
  footerNote,
}: SettingsFormProps<T>) {
  // Seed the editable copy from the loaded record once (render-time guard avoids
  // an effect/setState cascade); re-seeds when a new record object arrives.
  const [state, setState] = useState<{ src: T | undefined; values: Record<string, unknown> }>({
    src: undefined,
    values: {},
  });
  if (data && state.src !== data) {
    setState({ src: data, values: { ...data } });
  }
  const values = state.values;

  const set = (k: string, v: unknown) =>
    setState((s) => ({ ...s, values: { ...s.values, [k]: v } }));

  return (
    <Card>
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="p-4">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const val = values[f.name];
                return (
                  <Field
                    key={f.name}
                    label={f.label}
                    htmlFor={`set-${f.name}`}
                    help={f.help}
                    className={f.span2 ? "sm:col-span-2" : undefined}
                  >
                    {f.type === "switch" ? (
                      <Switch
                        id={`set-${f.name}`}
                        checked={!!val}
                        disabled={readOnly}
                        onChange={(c) => set(f.name, c)}
                      />
                    ) : f.type === "select" ? (
                      <Select
                        id={`set-${f.name}`}
                        value={String(val ?? "")}
                        disabled={readOnly}
                        onChange={(e) => set(f.name, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        id={`set-${f.name}`}
                        type={f.type === "number" ? "number" : f.type === "time" ? "time" : f.type === "date" ? "date" : "text"}
                        step={f.step}
                        value={String(val ?? "")}
                        disabled={readOnly}
                        onChange={(e) =>
                          set(f.name, f.type === "number" ? e.target.valueAsNumber : e.target.value)
                        }
                      />
                    )}
                  </Field>
                );
              })}
            </div>
            {!readOnly && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">{footerNote}</div>
                <Button size="sm" onClick={() => onSave(values)} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
