/**
 * Tenant user + role management — backed by auth-api (SSO), the true owner of
 * users/roles/memberships. erp-api only serves `/auth/me`.
 *
 * auth-api model (NOT Django):
 *  - A "user" in the UI is a tenant *membership*: `GET /admin/tenants/{id}/members`
 *    returns `{id,user_id,email,name,roles[],status,outlet_id,...}` (roles are
 *    plain strings, not FK rows).
 *  - Add/invite:  POST   /admin/tenants/{id}/members        {email,roles,name,phone}
 *  - Update:      PUT    /admin/tenants/{id}/members/{user_id}  {roles,status,outlet_id}
 *  - Remove:      DELETE /admin/tenants/{id}/members/{user_id}
 *  - Platform-wide user lifecycle (platform owners only):
 *      POST /admin/users/{user_id}/(activate|deactivate|suspend|reset-password|send-password-reset)
 *
 * There is NO standalone Role/Permission CRUD in auth-api — roles are free-form
 * strings on the membership and the available set is curated here. Permissions
 * are derived per-role from the JWT, not a managed catalogue (see permissions.ts
 * REPORT note). Status/IDs are therefore strings (UUIDs), not numbers.
 */

import { authAdminClient } from "@/lib/api/auth-admin-client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

/** A tenant member as returned by auth-api `ListTenantMembers`. */
export interface ManagedUser {
  /** Membership id (UUID). */
  id: string;
  /** Underlying user account id (UUID) — needed for member mutations. */
  user_id?: string;
  email?: string;
  /** Display name (from auth-api `name`/profile). */
  name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  /** Membership status: active | suspended | deactivated. */
  status?: string;
  /** Free-form role strings on the membership. */
  roles?: string[];
  outlet_id?: string | null;
  created_at?: string;
  updated_at?: string;
  /** Returned ONCE when an invite created a brand-new account. */
  temp_password?: string;
  [key: string]: unknown;
}

/** A role is just a string in auth-api; we model it as a labelled value. */
export interface Role {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface Permission {
  id: string;
  name: string;
  codename?: string;
  module?: string;
  [key: string]: unknown;
}

/** Resolve the tenant UUID member paths must be scoped to. */
function tenantPath(): string {
  const tid = authAdminClient.activeTenantId;
  if (!tid) throw new Error("No tenant selected for member management");
  return `/admin/tenants/${tid}/members`;
}

export const usersApi = {
  list: (params?: ListParams) =>
    authAdminClient.get<Paginated<ManagedUser> | ManagedUser[]>(tenantPath(), params),
  get: (userId: string) =>
    authAdminClient.get<ManagedUser>(`/admin/users/${userId}`),
  /** Add/invite a member by email (auth-api creates the account if new). */
  create: (data: Partial<ManagedUser>) =>
    authAdminClient.post<ManagedUser>(tenantPath(), {
      email: data.email,
      name: data.name ?? data.full_name,
      phone: data.phone,
      roles: data.roles ?? [],
    }),
  /** Update a member's roles/status (by user_id). */
  update: (userId: string, data: Partial<ManagedUser>) =>
    authAdminClient.put<ManagedUser>(`${tenantPath()}/${userId}`, {
      roles: data.roles,
      status: data.status,
      outlet_id: data.outlet_id,
    }),
  remove: (userId: string) =>
    authAdminClient.delete<void>(`${tenantPath()}/${userId}`),

  /* Platform-wide user lifecycle (platform owners only). */
  activate: (userId: string) =>
    authAdminClient.post<void>(`/admin/users/${userId}/activate`),
  deactivate: (userId: string) =>
    authAdminClient.post<void>(`/admin/users/${userId}/deactivate`),
  suspend: (userId: string) =>
    authAdminClient.post<void>(`/admin/users/${userId}/suspend`),
  /** Email the user a password-reset link (preferred over direct reset). */
  resetPassword: (userId: string) =>
    authAdminClient.post<void>(`/admin/users/${userId}/send-password-reset`),

  /** Set/clear a member's roles via the member update endpoint. */
  setRoles: (userId: string, roles: string[]) =>
    authAdminClient.put<ManagedUser>(`${tenantPath()}/${userId}`, { roles }),
};

/**
 * auth-api has no role table; the assignable role set is curated here. These are
 * the canonical tenant roles understood across the platform's services.
 */
export const TENANT_ROLES: Role[] = [
  { id: "admin", name: "Admin", description: "Full tenant administration" },
  { id: "manager", name: "Manager", description: "Manage operations & staff" },
  { id: "member", name: "Member", description: "Standard staff access" },
  { id: "cashier", name: "Cashier", description: "POS / register operator" },
  { id: "accountant", name: "Accountant", description: "Finance & treasury" },
  { id: "viewer", name: "Viewer", description: "Read-only access" },
];

export const rolesApi = {
  list: (_params?: ListParams) => Promise.resolve(TENANT_ROLES),
};

/**
 * REPORT: auth-api exposes no permission catalogue or per-permission CRUD —
 * effective permissions are derived from roles and surfaced in the JWT
 * (`permissions` claim), not managed as rows. The permissions admin screen has
 * no backing endpoint; this returns an empty set so the page degrades cleanly.
 */
export const permissionsApi = {
  list: (_params?: ListParams) => Promise.resolve([] as Permission[]),
};
