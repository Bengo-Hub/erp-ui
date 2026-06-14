"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

/** Derives breadcrumbs from the path after the /{orgSlug} segment. */
export function Breadcrumb() {
  const pathname = usePathname() || "";
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "";

  const rest = pathname.replace(new RegExp(`^/${orgSlug}`), "").replace(/^\//, "");
  const segments = rest ? rest.split("/").filter(Boolean) : [];
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const to = `/${orgSlug}/${segments.slice(0, i + 1).join("/")}`;
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { to, label, last: i === segments.length - 1 };
  });

  return (
    <nav className="flex items-center gap-1.5 px-4 sm:px-6 py-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
      <Link href={`/${orgSlug}`} className="flex items-center gap-1 hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.to} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          {c.last ? (
            <span className="font-semibold text-foreground">{c.label}</span>
          ) : (
            <Link href={c.to} className="hover:text-foreground">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
