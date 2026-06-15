import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// erp-api base. The Vue app appended `/api/v1` to VITE_API_URL; we do the same so
// callers pass DRF paths like `/hrm/employees/`.
const rawBase = process.env.NEXT_PUBLIC_API_URL || "https://erpapi.masterspace.co.ke";
const apiBaseUrl = `${rawBase.replace(/\/$/, "")}/api/v1`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extracts the filename from a Content-Disposition header value, if present. */
function parseContentDispositionFilename(header?: string): string {
  if (!header) return "";
  const match = header.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match?.[1] ? decodeURIComponent(match[1].trim()) : "";
}

/**
 * Singleton HTTP client for erp-api.
 *
 * Sends `Authorization: Bearer`, plus tenant scoping headers:
 *  - tenant users    → `X-Tenant-Slug` + `X-Tenant-ID` (UUID-validated)
 *  - platform owners → `?tenantId=<uuid>` query param (cross-tenant drill-in),
 *    omitting tenant headers (see docs/integrations.md §1.1).
 * `X-Outlet-ID` is sent whenever an outlet is selected.
 *
 * Response interceptor handles 401 (one refresh + retry) and 403
 * `subscription_inactive` (toast, no logout).
 */
class ApiClient {
  private instance: AxiosInstance;
  private accessToken: string | null = null;
  private tenantId: string | null = null;
  private tenantSlug: string | null = null;
  private platformOwner = false;
  private outletId: string | null = null;
  /** Tenant a platform owner has drilled into (sent as ?tenantId=). */
  private platformTenantId: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: apiBaseUrl,
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    });
    this.instance.interceptors.request.use(this.handleRequest);
    this.instance.interceptors.response.use((r) => r, this.handleError);
  }

  private handleRequest = (config: InternalAxiosRequestConfig) => {
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // erp-api uses `limit` for page size (shared pagination lib), but much of the
    // UI still passes the legacy DRF `page_size`. Translate it centrally so every
    // list call honours the requested size instead of falling back to the server
    // default. An explicit `limit` always wins.
    if (config.params && typeof config.params === "object") {
      const p = config.params as Record<string, unknown>;
      if (p.page_size != null && p.limit == null) {
        p.limit = p.page_size;
      }
      delete p.page_size;
    }

    // FormData → let the browser set the multipart boundary.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (this.platformOwner) {
      // Platform owners scope cross-tenant via ?tenantId=, NOT tenant headers.
      if (this.platformTenantId && UUID_REGEX.test(this.platformTenantId)) {
        config.params = { ...(config.params || {}), tenantId: this.platformTenantId };
      }
    } else {
      if (this.tenantSlug) config.headers["X-Tenant-Slug"] = this.tenantSlug;
      if (this.tenantId && UUID_REGEX.test(this.tenantId)) {
        config.headers["X-Tenant-ID"] = this.tenantId;
      }
    }

    if (this.outletId) config.headers["X-Outlet-ID"] = this.outletId;
    return config;
  };

  public setTenantContext(tenantId: string | null, tenantSlug: string | null) {
    this.tenantId = tenantId;
    this.tenantSlug = tenantSlug;
  }

  public setPlatformOwner(isPlatformOwner: boolean) {
    this.platformOwner = isPlatformOwner;
  }

  /** Tenant a platform owner is drilling into (sent as ?tenantId=). null = all. */
  public setPlatformTenant(tenantId: string | null) {
    this.platformTenantId = tenantId;
  }

  public setOutletID(outletId: string | null) {
    this.outletId = outletId;
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private on401Callback: (() => void) | null = null;
  private onSubscription403Callback: ((data: unknown) => void) | null = null;

  /** Runs after a 401 whose refresh already failed (e.g. clear session). */
  public setOn401(callback: (() => void) | null) {
    this.on401Callback = callback;
  }

  /** Runs on a 403 with code=subscription_inactive / upgrade=true. */
  public setOnSubscription403(callback: ((data: unknown) => void) | null) {
    this.onSubscription403Callback = callback;
  }

  private handleError = async (error: {
    response?: { status?: number; data?: { code?: string; upgrade?: boolean } };
    config?: InternalAxiosRequestConfig & { _retried?: boolean };
  }) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token already cleared (explicit logout) — bail.
      if (!this.accessToken) return Promise.reject(error);

      const url = error.config?.url ?? "";
      if (!url.includes("/auth/me") && error.config && !error.config._retried) {
        const { refreshAccessToken } = await import("@/lib/auth/token-refresh");
        const newToken = await refreshAccessToken();
        if (newToken) {
          this.accessToken = newToken;
          error.config._retried = true;
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return this.instance.request(error.config);
        }
        this.on401Callback?.();
      }
    }

    if (status === 403 && this.onSubscription403Callback) {
      const data = error.response?.data;
      if (data?.code === "subscription_inactive" || data?.upgrade === true) {
        this.onSubscription403Callback(data);
      }
    }

    return Promise.reject(error);
  };

  public get<T>(url: string, params?: unknown): Promise<T> {
    return this.instance.get<T>(url, { params }).then((res: AxiosResponse<T>) => res.data);
  }

  /** Fetches a binary response (e.g. PDF/CSV export) through the shared client. */
  public async getBlob(
    url: string,
    fallbackFileName: string,
    params?: unknown,
  ): Promise<{ blob: Blob; fileName: string }> {
    const res = await this.instance.get<Blob>(url, { params, responseType: "blob" });
    return {
      blob: res.data,
      fileName:
        parseContentDispositionFilename(res.headers?.["content-disposition"]) || fallbackFileName,
    };
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post<T>(url, data, config).then((res: AxiosResponse<T>) => res.data);
  }

  public put<T>(url: string, data?: unknown): Promise<T> {
    return this.instance.put<T>(url, data).then((res: AxiosResponse<T>) => res.data);
  }

  public patch<T>(url: string, data?: unknown): Promise<T> {
    return this.instance.patch<T>(url, data).then((res: AxiosResponse<T>) => res.data);
  }

  public delete<T>(url: string): Promise<T> {
    return this.instance.delete<T>(url).then((res: AxiosResponse<T>) => res.data);
  }
}

export const apiClient = new ApiClient();
