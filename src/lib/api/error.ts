/** Extract a human-readable message from an axios/DRF error. */
export function extractApiError(error: unknown, fallback = "Something went wrong"): string {
  const e = error as {
    response?: { data?: unknown; status?: number };
    message?: string;
  };
  const data = e?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
    // DRF field errors: { field: ["msg", ...] }
    for (const key of Object.keys(d)) {
      const val = d[key];
      if (Array.isArray(val) && typeof val[0] === "string") {
        return key === "non_field_errors" ? val[0] : `${key}: ${val[0]}`;
      }
      if (typeof val === "string") return `${key}: ${val}`;
    }
  }

  if (e?.message) return e.message;
  return fallback;
}
