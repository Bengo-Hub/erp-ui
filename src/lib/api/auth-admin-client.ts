/**
 * Singleton HTTP client for auth-api (SSO) admin/self-service endpoints.
 *
 * User / role / permission / member management is auth-service's domain — NOT
 * erp-api (which only serves `/auth/me`). This client mirrors the shared erp-api
 * `apiClient` pattern (Bearer + tenant headers + 401-refresh) but points at
 * `${NEXT_PUBLIC_AUTH_API_URL}/api/v1` so callers pass auth-api paths like
 * `/admin/tenants/{id}/members`.
 *
 * Token + tenant context are pushed in from the auth store via `syncAuthAdmin`
 * (see store/auth.ts), exactly like the erp-api client.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const rawBase = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_SSO_URL ||
  "https://sso.codevertexitsolutions.com"
).replace(/\/$/, "");
const authApiBaseUrl = `${rawBase}/api/v1`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class AuthAdminClient {
  private instance: AxiosInstance;
  private accessToken: string | null = null;
  private tenantId: string | null = null;
  private tenantSlug: string | null = null;
  /** Tenant a platform owner has drilled into (overrides their own tenantId). */
  private platformTenantId: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: authApiBaseUrl,
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
    if (this.tenantSlug) config.headers["X-Tenant-Slug"] = this.tenantSlug;
    if (this.tenantId && UUID_REGEX.test(this.tenantId)) {
      config.headers["X-Tenant-ID"] = this.tenantId;
    }
    return config;
  };

  public setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  public setTenantContext(tenantId: string | null, tenantSlug: string | null) {
    this.tenantId = tenantId;
    this.tenantSlug = tenantSlug;
  }

  /** Tenant a platform owner is drilling into. null = use own tenantId. */
  public setPlatformTenant(tenantId: string | null) {
    this.platformTenantId = tenantId;
  }

  /**
   * The tenant UUID member-management paths must be scoped to. Platform owners
   * who have drilled into a tenant use that; everyone else uses their own.
   */
  public get activeTenantId(): string | null {
    if (this.platformTenantId && UUID_REGEX.test(this.platformTenantId)) {
      return this.platformTenantId;
    }
    return this.tenantId && UUID_REGEX.test(this.tenantId) ? this.tenantId : null;
  }

  private handleError = async (error: {
    response?: { status?: number };
    config?: InternalAxiosRequestConfig & { _retried?: boolean };
  }) => {
    const status = error.response?.status;
    if (status === 401) {
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
      }
    }
    return Promise.reject(error);
  };

  public get<T>(url: string, params?: unknown): Promise<T> {
    return this.instance.get<T>(url, { params }).then((r: AxiosResponse<T>) => r.data);
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post<T>(url, data, config).then((r: AxiosResponse<T>) => r.data);
  }

  public put<T>(url: string, data?: unknown): Promise<T> {
    return this.instance.put<T>(url, data).then((r: AxiosResponse<T>) => r.data);
  }

  public patch<T>(url: string, data?: unknown): Promise<T> {
    return this.instance.patch<T>(url, data).then((r: AxiosResponse<T>) => r.data);
  }

  public delete<T>(url: string): Promise<T> {
    return this.instance.delete<T>(url).then((r: AxiosResponse<T>) => r.data);
  }
}

export const authAdminClient = new AuthAdminClient();
