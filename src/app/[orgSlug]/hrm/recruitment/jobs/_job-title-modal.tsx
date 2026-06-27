"use client";

import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { useSaveJobTitle } from "@/hooks/use-hrm-settings";

/**
 * Inline "add a job title" modal — creates a job title in the org master
 * (POST /hrm/employees/job-titles) and hands the new name back to the caller.
 */
export function JobTitleModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const save = useSaveJobTitle();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    save.mutate(
      { data: { name: trimmed, description } },
      {
        onSuccess: () => {
          onCreated(trimmed);
          setName("");
          setDescription("");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Job Title"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={save.isPending || !name.trim()}>
            {save.isPending ? "Saving…" : "Add Job Title"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Job Title" htmlFor="jt-name" required>
          <Input
            id="jt-name"
            value={name}
            placeholder="e.g. Senior Accountant"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Description" htmlFor="jt-desc">
          <Input
            id="jt-desc"
            value={description}
            placeholder="Optional"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
