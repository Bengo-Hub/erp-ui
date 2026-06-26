"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { careersPublicApi, type PublicPosting } from "@/lib/api/careers-public";

export default function CareersListPage() {
  const orgSlug = (useParams()?.orgSlug as string) ?? "";
  const [postings, setPostings] = useState<PublicPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) return;
    careersPublicApi
      .listPostings(orgSlug)
      .then((r) => setPostings(r.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgSlug]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Open Positions</h1>
        <p className="mt-2 text-gray-600">Explore current opportunities and apply online.</p>
      </header>

      {loading && <p className="text-gray-500">Loading openings…</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loading && !error && postings.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          There are no open positions right now. Please check back later.
        </p>
      )}

      <ul className="space-y-3">
        {postings.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/careers/${orgSlug}/${p.slug}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-900 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {[p.department, p.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {p.employment_type && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                    {p.employment_type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
