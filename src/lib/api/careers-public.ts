// Public (unauthenticated) careers-portal client. Talks straight to the erp-api public careers
// endpoints with a plain fetch — NO auth token — so it works for anonymous visitors.
//
// Endpoints (erp-api, registered BEFORE auth):
//   GET  /api/v1/careers/{slug}/postings                       -> { data: PublicPosting[]; count }
//   GET  /api/v1/careers/{slug}/postings/{postingSlug}         -> PublicPosting
//   POST /api/v1/careers/{slug}/postings/{postingSlug}/applications
//   GET  /api/v1/business/public-branding/?slug={slug}         -> PublicBranding  (always 200)
//
// Error envelope from erp-api is { error: string, code: string } — NOT { message }.

import { resolveApiBaseUrl } from "@/lib/api/client";

const BASE = `${resolveApiBaseUrl().replace(/\/$/, "")}/api/v1`;

export interface PublicPosting {
  slug: string;
  title: string;
  description?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  num_positions?: number;
  application_deadline?: string;
  posted_at?: string;
}

export interface ApplyPayload {
  full_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
}

// Tenant branding from auth-api (read through erp-api). All fields optional — the public
// endpoint degrades to just { slug } when the tenant is unknown or branding is unconfigured.
export interface PublicBranding {
  name?: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  kra_pin?: string;
  address?: string;
}

// ApiError carries the HTTP status so callers can distinguish 404 (org/posting not found)
// from other failures and render the right empty/error state.
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function readError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string; code?: string };
  const msg = body.error || body.message || `Request failed (${res.status})`;
  return new ApiError(msg, res.status, body.code);
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export const careersPublicApi = {
  listPostings: (orgSlug: string) =>
    getJSON<{ data: PublicPosting[]; count: number }>(
      `${BASE}/careers/${encodeURIComponent(orgSlug)}/postings`,
    ),

  getPosting: (orgSlug: string, postingSlug: string) =>
    getJSON<PublicPosting>(
      `${BASE}/careers/${encodeURIComponent(orgSlug)}/postings/${encodeURIComponent(postingSlug)}`,
    ),

  // Branding endpoint always returns 200 (degrades to { slug }). We still guard so a network
  // failure never blocks the page — callers fall back to a neutral default.
  getBranding: async (orgSlug: string): Promise<PublicBranding> => {
    try {
      return await getJSON<PublicBranding>(
        `${BASE}/business/public-branding/?slug=${encodeURIComponent(orgSlug)}`,
      );
    } catch {
      return { slug: orgSlug };
    }
  },

  apply: async (orgSlug: string, postingSlug: string, payload: ApplyPayload) => {
    const res = await fetch(
      `${BASE}/careers/${encodeURIComponent(orgSlug)}/postings/${encodeURIComponent(postingSlug)}/applications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<{ id: string; status: string }>;
  },
};
