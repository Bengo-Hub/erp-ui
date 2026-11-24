const NOT_AVAILABLE = "This action isn't available yet.";
const FORBIDDEN = "You don't have permission to do this.";
const FAILED = 'Something went wrong. Please try again.';

/** A plain message for a status the API sent without a readable body. */
function statusMessage(status: number | undefined): string | undefined {
    if (status === 404 || status === 405) return NOT_AVAILABLE;
    if (status === 403) return FORBIDDEN;
    if (status === undefined || status >= 500) return FAILED;
    return undefined;
}

/**
 * Extract a human-readable message from an API error for a toast or inline alert. The API's
 * own `error` (or `detail`/`message`, or a DRF field error) wins; without one the status picks a
 * plain sentence. The raw transport text ("Request failed with status code 405", "Network
 * Error") is never shown.
 */
export function extractApiError(error: unknown, fallback = FAILED): string {
    const e = error as {
        response?: { data?: unknown; status?: number };
        request?: unknown;
        isAxiosError?: boolean;
        status?: number;
        message?: string;
    };
    // The streaming client throws a plain Error carrying `status`.
    const status = e?.response?.status ?? e?.status;
    const data = e?.response?.data;

    if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if (typeof d.error === 'string' && d.error.trim()) return d.error;
        if (typeof d.detail === 'string' && d.detail.trim()) return d.detail;
        if (typeof d.message === 'string' && d.message.trim()) return d.message;
        // DRF field errors: { field: ["msg", ...] }
        for (const key of Object.keys(d)) {
            const val = d[key];
            if (Array.isArray(val) && typeof val[0] === 'string') {
                return key === 'non_field_errors' ? val[0] : `${key}: ${val[0]}`;
            }
        }
    }

    // A short plain-text body from a 4xx is the API talking; router 404/405 pages and 5xx
    // bodies are not.
    if (typeof data === 'string' && data.trim() && status !== undefined && status < 500 && status !== 404 && status !== 405 && !data.trimStart().startsWith('<') && data.length <= 200) {
        return data.trim();
    }

    const isTransport = Boolean(e?.isAxiosError || e?.response || e?.request || typeof e?.status === 'number');
    if (isTransport) return statusMessage(status) ?? fallback;

    // An Error thrown by our own code (validation before the request) carries a readable message.
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}
