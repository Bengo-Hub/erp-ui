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
