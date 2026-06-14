"use client";

import { useParams, useRouter } from "next/navigation";

import { Tabs } from "@/components/ui/tabs";

const TABS = [
  { key: "users", label: "Users", path: "/users" },
  { key: "roles", label: "Roles", path: "/users/roles" },
  { key: "permissions", label: "Permissions", path: "/users/permissions" },
  { key: "security", label: "Security", path: "/security/dashboard" },
  { key: "backups", label: "Backups", path: "/security/backups" },
];

/** Cross-section admin nav (users / roles / permissions / security / backups). */
export function UsersTabs({ active }: { active: string }) {
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
