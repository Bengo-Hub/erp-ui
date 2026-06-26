// Public (unauthenticated) careers-portal client. Talks straight to the erp-api public careers
// endpoints with a plain fetch — NO auth token — so it works for anonymous visitors.

const BASE = `${(process.env.NEXT_PUBLIC_API_URL || "https://erpapi.masterspace.co.ke").replace(/\/$/, "")}/api/v1`;

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

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const careersPublicApi = {
  listPostings: (orgSlug: string) =>
    getJSON<{ data: PublicPosting[]; count: number }>(`${BASE}/careers/${orgSlug}/postings`),

  getPosting: (orgSlug: string, postingSlug: string) =>
    getJSON<PublicPosting>(`${BASE}/careers/${orgSlug}/postings/${postingSlug}`),

  apply: async (orgSlug: string, postingSlug: string, payload: ApplyPayload) => {
    const res = await fetch(`${BASE}/careers/${orgSlug}/postings/${postingSlug}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error((await res.json().catch(() => ({}))).message || `Application failed (${res.status})`);
    }
    return res.json() as Promise<{ id: string; status: string }>;
  },
};
