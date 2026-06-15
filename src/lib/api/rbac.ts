/** erp-api service-level RBAC: erp owns its own roles + permissions (Trinity Layer 3).
 *  Global role assignment stays in auth-api (Users tab); this manages erp.* roles/perms. */
import { apiClient } from "@/lib/api/client";

export interface ErpPermission {
  id: string;
  permission_code: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface ErpRole {
  id: string;
  role_code: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  tenant_id?: string | null;
  permission_count: number;
  member_count: number;
  /** Only present on GET /rbac/roles/{id}. */
  permission_codes?: string[];
}

export const rbacApi = {
  listPermissions: () => apiClient.get<{ permissions: ErpPermission[] }>(`/rbac/permissions`),
  listRoles: () => apiClient.get<{ roles: ErpRole[] }>(`/rbac/roles`),
  getRole: (id: string) => apiClient.get<ErpRole>(`/rbac/roles/${id}`),
  createRole: (data: { role_code: string; name: string; description?: string }) =>
    apiClient.post<ErpRole>(`/rbac/roles`, data),
  updateRole: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put<ErpRole>(`/rbac/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete<void>(`/rbac/roles/${id}`),
  setRolePermissions: (id: string, permission_codes: string[]) =>
    apiClient.put<{ role_id: string; permission_codes: string[] }>(`/rbac/roles/${id}/permissions`, {
      permission_codes,
    }),
};

/** Group a permission catalogue by module, for matrix + catalogue rendering. */
export function groupPermissions(perms: ErpPermission[]): Record<string, ErpPermission[]> {
  return perms.reduce<Record<string, ErpPermission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});
}
