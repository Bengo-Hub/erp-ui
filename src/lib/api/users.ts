/** erp-api user/role/permission/security/backup admin (auth viewsets). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

export interface ManagedUser {
  id: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  last_login?: string | null;
  date_joined?: string;
  roles?: (Role | string)[];
  role_ids?: number[];
  phone?: string;
  [key: string]: unknown;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: (Permission | number)[];
  permission_ids?: number[];
  user_count?: number;
  [key: string]: unknown;
}

export interface Permission {
  id: number;
  name: string;
  codename?: string;
  module?: string;
  content_type?: string | { app_label?: string; model?: string };
  [key: string]: unknown;
}

export const usersApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<ManagedUser> | ManagedUser[]>(`/auth/listusers/`, params),
  get: (id: number | string) => apiClient.get<ManagedUser>(`/auth/listusers/${id}/`),
  create: (data: Partial<ManagedUser>) => apiClient.post<ManagedUser>(`/auth/listusers/`, data),
  update: (id: number | string, data: Partial<ManagedUser>) =>
    apiClient.patch<ManagedUser>(`/auth/listusers/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`/auth/listusers/${id}/`),
  activate: (id: number | string) => apiClient.post<void>(`/auth/listusers/${id}/activate/`),
  deactivate: (id: number | string) => apiClient.post<void>(`/auth/listusers/${id}/deactivate/`),
  resetPassword: (id: number | string) =>
    apiClient.post<void>(`/auth/listusers/${id}/reset-password/`),
  assignRole: (userId: number | string, roleId: number | string) =>
    apiClient.post<void>(`/auth/listusers/${userId}/assign-role/${roleId}/`),
  removeRole: (userId: number | string, roleId: number | string) =>
    apiClient.post<void>(`/auth/listusers/${userId}/remove-role/${roleId}/`),
  changePassword: (data: { old_password?: string; new_password: string }) =>
    apiClient.post<void>(`/auth/change-password/`, data),
};

export const rolesApi = {
  list: (params?: ListParams) => apiClient.get<Paginated<Role> | Role[]>(`/auth/roles/`, params),
  get: (id: number | string) => apiClient.get<Role>(`/auth/roles/${id}/`),
  create: (data: Partial<Role>) => apiClient.post<Role>(`/auth/roles/`, data),
  update: (id: number | string, data: Partial<Role>) =>
    apiClient.put<Role>(`/auth/roles/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`/auth/roles/${id}/`),
  assignPermission: (roleId: number | string, permId: number | string) =>
    apiClient.post<void>(`/auth/roles/${roleId}/assign-permission/${permId}/`),
  removePermission: (roleId: number | string, permId: number | string) =>
    apiClient.post<void>(`/auth/roles/${roleId}/remove-permission/${permId}/`),
};

export const permissionsApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Permission> | Permission[]>(`/auth/permissions/`, params),
  get: (id: number | string) => apiClient.get<Permission>(`/auth/permissions/${id}/`),
  create: (data: Partial<Permission>) => apiClient.post<Permission>(`/auth/permissions/`, data),
  update: (id: number | string, data: Partial<Permission>) =>
    apiClient.put<Permission>(`/auth/permissions/${id}/`, data),
  remove: (id: number | string) => apiClient.delete<void>(`/auth/permissions/${id}/`),
};
