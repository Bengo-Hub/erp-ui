"use client";

import { useParams, useRouter } from "next/navigation";

import { Tabs } from "@/components/ui/tabs";

const TABS = [
  { key: "company", label: "Company", path: "/settings" },
  { key: "currency-time", label: "Currency & Time", path: "/settings/currency-time" },
  { key: "branding", label: "Branding", path: "/settings/branding" },
  { key: "hrm", label: "HR Settings", path: "/settings/hrm/departments" },
  { key: "payroll", label: "Payroll Settings", path: "/settings/payroll/earnings" },
];

/** Cross-section settings nav. */
export function SettingsTabs({ active }: { active: string }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const router = useRouter();
  return (
    <Tabs
      tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
      active={active}
      onChange={(key) => {
        const t = TABS.find((x) => x.key === key);
        if (t) router.push(`/${orgSlug}${t.path}`);
      }}
    />
  );
}
