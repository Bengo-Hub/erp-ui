"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  permissionsApi,
  rolesApi,
  usersApi,
  type ManagedUser,
  type Permission,
  type Role,
} from "@/lib/api/users";
import { makeResourceHooks } from "@/hooks/use-crud-resource";

/* ---- Users ---- */
const users = makeResourceHooks<ManagedUser>("users", usersApi, "User");
export const useUsers = users.useList;
export const useUser = users.useDetail;
export const useSaveUser = users.useSave;
export const useDeleteUser = users.useRemove;

/** User lifecycle/action mutations (activate/deactivate/reset password). */
export function useUserActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });
  const activate = useMutation({
    mutationFn: (id: number | string) => usersApi.activate(id),
    onSuccess: () => { invalidate(); toast.success("User activated"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to activate user")),
  });
  const deactivate = useMutation({
    mutationFn: (id: number | string) => usersApi.deactivate(id),
    onSuccess: () => { invalidate(); toast.success("User deactivated"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to deactivate user")),
  });
  const resetPassword = useMutation({
    mutationFn: (id: number | string) => usersApi.resetPassword(id),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e) => toast.error(extractApiError(e, "Failed to reset password")),
  });
  const assignRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number | string; roleId: number | string }) =>
      usersApi.assignRole(userId, roleId),
    onSuccess: () => { invalidate(); toast.success("Role assigned"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to assign role")),
  });
  const removeRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number | string; roleId: number | string }) =>
      usersApi.removeRole(userId, roleId),
    onSuccess: () => { invalidate(); toast.success("Role removed"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove role")),
  });
  return { activate, deactivate, resetPassword, assignRole, removeRole };
}

/* ---- Roles ---- */
const roles = makeResourceHooks<Role>("roles", rolesApi, "Role");
export const useRoles = roles.useList;
export const useRole = roles.useDetail;
export const useSaveRole = roles.useSave;
export const useDeleteRole = roles.useRemove;

/** Assign/remove a permission on a role; invalidates role queries. */
export function useRolePermissionActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["roles"] });
  const assign = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: number | string; permId: number | string }) =>
      rolesApi.assignPermission(roleId, permId),
    onSuccess: invalidate,
    onError: (e) => toast.error(extractApiError(e, "Failed to assign permission")),
  });
  const remove = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: number | string; permId: number | string }) =>
      rolesApi.removePermission(roleId, permId),
    onSuccess: invalidate,
    onError: (e) => toast.error(extractApiError(e, "Failed to remove permission")),
  });
  return { assign, remove };
}

/* ---- Permissions ---- */
const permissions = makeResourceHooks<Permission>("permissions", permissionsApi, "Permission");
export const useSavePermission = permissions.useSave;
export const useDeletePermission = permissions.useRemove;

/** Permissions list (defaults to a large page so role editors get them all). */
export function usePermissions(params?: ListParams) {
  return useQuery({
    queryKey: ["permissions", "list", params ?? {}],
    queryFn: () => permissionsApi.list({ page_size: 500, ...params }),
  });
}
