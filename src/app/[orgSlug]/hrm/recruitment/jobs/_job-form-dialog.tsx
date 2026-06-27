"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useDepartmentOptions } from "@/hooks/use-option-hooks";
import { useOutlets } from "@/hooks/use-outlets";
import { LOCATION_OPTIONS } from "@/lib/data/africa-cities";
import { type JobPosting } from "@/lib/api/recruitment";
import { EMPLOYMENT_TYPES } from "@/lib/hrm";

/** Currencies relevant to the Africa-focused tenant base. */
const CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "NGN", "ZAR", "GHS", "RWF"];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

/** Editable form shape (strings for inputs; coerced on submit). */
interface JobForm {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  num_positions: string;
  status: string;
  application_deadline: string;
  is_public: boolean;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  description: string;
  requirements: string;
  responsibilities: string;
}

function emptyForm(): JobForm {
  return {
    title: "",
    department: "",
    location: "",
    employment_type: "",
    num_positions: "1",
    status: "draft",
    application_deadline: "",
    is_public: false,
    salary_min: "",
    salary_max: "",
    salary_currency: "KES",
    description: "",
    requirements: "",
    responsibilities: "",
  };
}

function toForm(job: JobPosting | null): JobForm {
  if (!job) return emptyForm();
  return {
    title: job.title ?? "",
    department: job.department != null ? String(job.department) : "",
    location: job.location ?? "",
    employment_type: job.employment_type ?? "",
    num_positions: String(job.num_positions ?? job.openings ?? 1),
    status: job.status ?? "draft",
    application_deadline: job.application_deadline ?? job.closing_date ?? "",
    is_public: job.is_public ?? false,
    salary_min: job.salary_min ?? "",
    salary_max: job.salary_max ?? "",
    salary_currency: job.salary_currency || "KES",
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    responsibilities: job.responsibilities ?? "",
  };
}

/** A labelled section block inside the modal. */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

interface Props {
  open: boolean;
  job: JobPosting | null;
  orgSlug: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: Partial<JobPosting>) => void;
}

/**
 * Large, sectioned job-posting editor. Rich-text for description / requirements /
 * responsibilities, a searchable Africa-cities location picker pre-filled to the
 * tenant HQ branch, salary band + currency, and the standard posting metadata.
 */
export function JobFormDialog({ open, job, orgSlug, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<JobForm>(emptyForm);
  const departments = useDepartmentOptions();
  const { data: outlets } = useOutlets(orgSlug, open);

  // Default location = the tenant HQ branch matched to a bundled city (else Nairobi).
  const hqLocation = useMemo(() => {
    const list = outlets ?? [];
    const hq = list.find((o) => o.is_hq) ?? list[0];
    if (!hq?.name) return "";
    const name = hq.name.toLowerCase();
    const match = LOCATION_OPTIONS.find((o) => name.includes(o.label.split(",")[0].toLowerCase()));
    return match?.value ?? "";
  }, [outlets]);

  // Reset whenever the dialog (re)opens, seeding HQ for brand-new postings.
  useEffect(() => {
    if (!open) return;
    const seeded = toForm(job);
    if (!job && !seeded.location && hqLocation) seeded.location = hqLocation;
    setForm(seeded);
  }, [open, job, hqLocation]);

  const set = <K extends keyof JobForm>(key: K, value: JobForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const titleMissing = !form.title.trim();

  const submit = () => {
    if (titleMissing) return;
    const payload: Partial<JobPosting> = {
      title: form.title.trim(),
      department: form.department ? form.department : undefined,
      location: form.location || undefined,
      employment_type: form.employment_type || undefined,
      num_positions: form.num_positions ? Number(form.num_positions) : undefined,
      status: form.status || "draft",
      application_deadline: form.application_deadline || undefined,
      is_public: form.is_public,
      salary_min: form.salary_min !== "" ? form.salary_min : undefined,
      salary_max: form.salary_max !== "" ? form.salary_max : undefined,
      salary_currency: form.salary_currency || undefined,
      description: form.description || undefined,
      requirements: form.requirements || undefined,
      responsibilities: form.responsibilities || undefined,
    };
    onSave(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={job ? "Edit Job Posting" : "New Job Posting"}
      description="Define the role, compensation and where to advertise it."
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={saving || titleMissing}>
            {saving ? "Saving…" : job ? "Save Changes" : "Create Posting"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ---- Role basics ---- */}
        <Section title="Role">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job Title" htmlFor="title" required className="sm:col-span-2">
              <Input
                id="title"
                value={form.title}
                placeholder="e.g. Senior Accountant"
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label="Department" htmlFor="department">
              <Combobox
                id="department"
                value={form.department}
                onChange={(v) => set("department", v)}
                options={departments.options}
                loading={departments.isLoading}
                placeholder="Select department…"
              />
            </Field>
            <Field
              label="Location"
              htmlFor="location"
              help="Pre-filled to your HQ branch — change or type to search."
            >
              <Combobox
                id="location"
                value={form.location}
                onChange={(v) => set("location", v)}
                options={LOCATION_OPTIONS}
                placeholder="Search a city…"
                searchPlaceholder="Search cities…"
              />
            </Field>
            <Field label="Employment Type" htmlFor="employment_type">
              <Select
                id="employment_type"
                value={form.employment_type}
                onChange={(e) => set("employment_type", e.target.value)}
              >
                <option value="">Select…</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Openings" htmlFor="num_positions">
              <Input
                id="num_positions"
                type="number"
                min={1}
                value={form.num_positions}
                onChange={(e) => set("num_positions", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ---- Compensation ---- */}
        <Section title="Compensation" hint="Optional salary band shown on the careers portal.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Currency" htmlFor="salary_currency">
              <Select
                id="salary_currency"
                value={form.salary_currency}
                onChange={(e) => set("salary_currency", e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Minimum" htmlFor="salary_min">
              <Input
                id="salary_min"
                type="number"
                min={0}
                value={form.salary_min}
                placeholder="0"
                onChange={(e) => set("salary_min", e.target.value)}
              />
            </Field>
            <Field label="Maximum" htmlFor="salary_max">
              <Input
                id="salary_max"
                type="number"
                min={0}
                value={form.salary_max}
                placeholder="0"
                onChange={(e) => set("salary_max", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ---- Description ---- */}
        <Section title="Description" hint="The overview applicants see first.">
          <RichTextEditor
            id="description"
            value={form.description}
            onChange={(html) => set("description", html)}
            placeholder="Describe the role, team and mission…"
          />
        </Section>

        {/* ---- Requirements ---- */}
        <Section title="Requirements" hint="Skills, qualifications and experience.">
          <RichTextEditor
            id="requirements"
            value={form.requirements}
            onChange={(html) => set("requirements", html)}
            placeholder="List the must-have qualifications…"
          />
        </Section>

        {/* ---- Responsibilities ---- */}
        <Section title="Responsibilities" hint="What the hire will own day to day.">
          <RichTextEditor
            id="responsibilities"
            value={form.responsibilities}
            onChange={(html) => set("responsibilities", html)}
            placeholder="List the key responsibilities…"
          />
        </Section>

        {/* ---- Publishing ---- */}
        <Section title="Publishing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="status">
              <Select id="status" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Closing Date" htmlFor="application_deadline">
              <Input
                id="application_deadline"
                type="date"
                value={form.application_deadline}
                onChange={(e) => set("application_deadline", e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Publish to public careers portal</p>
                <p className="text-xs text-muted-foreground">
                  When on, this posting is visible to external applicants.
                </p>
              </div>
              <Switch checked={form.is_public} onChange={(v) => set("is_public", v)} id="is_public" />
            </div>
          </div>
        </Section>
      </div>
    </Dialog>
  );
}
