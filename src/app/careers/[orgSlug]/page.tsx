"use client";

import { useParams } from "next/navigation";
import { CareersListing } from "@bengo-hub/shared-ui-lib/careers";
import { resolveApiBaseUrl } from "@/lib/api/client";

export default function CareersListPage() {
  const orgSlug = (useParams()?.orgSlug as string) ?? "";

  return (
    <CareersListing
      orgSlug={orgSlug}
      apiBaseUrl={resolveApiBaseUrl()}
      linkToPosting={(postingSlug) => `/careers/${orgSlug}/${postingSlug}`}
    />
  );
}
