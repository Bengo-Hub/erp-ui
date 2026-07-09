/** Identity + RBAC profile, merged from SSO /auth/me and erp-api /auth/me/. */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  organizationId: string;
  tenantId: string;
  tenantSlug: string;
  outletId?: string | null;
  isHqUser?: boolean;
  isPlatformOwner?: boolean;
  isSuperUser?: boolean;
  /**
   * Platform-granted per-tenant subscription exemption (JWT `sub_exempt` claim, source of
   * truth = auth-api Tenant.subscription_exempt). When true the tenant bypasses ALL
   * subscription gating — the Upgrade banner and every FeatureLock must stay hidden.
   */
  subExempt?: boolean;
  /** Resolved billing mode (`service_charge` = pay-per-transaction, also bypasses gating). */
  billingMode?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: string;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "error"
  | "syncing"
  | "subscription_required";
