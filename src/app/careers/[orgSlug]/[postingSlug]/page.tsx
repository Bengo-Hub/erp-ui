"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { careersPublicApi, type ApplyPayload, type PublicPosting } from "@/lib/api/careers-public";

export default function CareersDetailPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? "";
  const postingSlug = (params?.postingSlug as string) ?? "";

  const [posting, setPosting] = useState<PublicPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ApplyPayload>({ full_name: "", email: "", phone: "", cover_letter: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug || !postingSlug) return;
    careersPublicApi
      .getPosting(orgSlug, postingSlug)
      .then(setPosting)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgSlug, postingSlug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await careersPublicApi.apply(orgSlug, postingSlug, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-12 text-gray-500">Loading…</main>;
  if (error || !posting)
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error || "Position not found."}</p>
        <Link href={`/careers/${orgSlug}`} className="mt-4 inline-block text-sm text-gray-900 underline">
          ← Back to openings
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href={`/careers/${orgSlug}`} className="text-sm text-gray-500 hover:text-gray-900">
        ← All openings
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{posting.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {[posting.department, posting.location, posting.employment_type?.replace(/_/g, " ")]
            .filter(Boolean)
            .join(" · ")}
          {posting.application_deadline ? ` · Apply by ${posting.application_deadline}` : ""}
        </p>
      </header>

      {posting.description && (
        <section className="mt-6 whitespace-pre-wrap text-gray-700">{posting.description}</section>
      )}

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Apply for this role</h2>
        {submitted ? (
          <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            Thank you — your application has been received. We&apos;ll be in touch.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name *</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cover letter</label>
              <textarea
                rows={5}
                value={form.cover_letter}
                onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="Tell us why you're a great fit…"
              />
            </div>
            {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
