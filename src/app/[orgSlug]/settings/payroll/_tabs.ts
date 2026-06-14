"use client";

import { useParams, useRouter } from "next/navigation";

import { type TabItem } from "@/components/ui/tabs";

const PAYROLL_SETTINGS_TABS: { key: string; label: string }[] = [
  { key: "earnings", label: "Earnings" },
  { key: "deductions", label: "Deductions" },
  { key: "benefits", label: "Benefits" },
  { key: "loans", label: "Loans" },
  { key: "formulas", label: "Formulas" },
  { key: "statutory", label: "Tax & Statutory" },
];

/** Tabbed navigation across payroll-settings pages. */
export function usePayrollSettingsTabs(active: string): {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
} {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const tabs: TabItem[] = PAYROLL_SETTINGS_TABS.map((t) => ({ key: t.key, label: t.label }));
  const onChange = (key: string) => router.push(`/${orgSlug}/settings/payroll/${key}`);
  return { tabs, active, onChange };
}
