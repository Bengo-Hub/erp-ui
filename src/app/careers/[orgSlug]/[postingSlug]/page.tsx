"use client";

import { useParams } from "next/navigation";
import { CareersPostingDetail } from "@bengo-hub/shared-ui-lib/careers";
import { resolveApiBaseUrl } from "@/lib/api/client";

export default function CareersDetailPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? "";
  const postingSlug = (params?.postingSlug as string) ?? "";

  return (
    <CareersPostingDetail
      orgSlug={orgSlug}
      postingSlug={postingSlug}
      apiBaseUrl={resolveApiBaseUrl()}
      backHref={`/careers/${orgSlug}`}
    />
  );
}
