"use client";

import { useParams, useRouter } from "next/navigation";

import { type TabItem } from "@/components/ui/tabs";

const HRM_SETTINGS_TABS: { key: string; label: string; path: string }[] = [
  { key: "departments", label: "Departments", path: "departments" },
  { key: "job-titles", label: "Job Titles", path: "job-titles" },
  { key: "job-groups", label: "Job Groups", path: "job-groups" },
];

/** Tabbed navigation across the HRM organization-structure settings pages. */
export function useHrmSettingsTabs(active: string): {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
} {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const tabs: TabItem[] = HRM_SETTINGS_TABS.map((t) => ({ key: t.key, label: t.label }));
  const onChange = (key: string) => {
    const target = HRM_SETTINGS_TABS.find((t) => t.key === key);
    if (target) router.push(`/${orgSlug}/settings/hrm/${target.path}`);
  };
  return { tabs, active, onChange };
}
