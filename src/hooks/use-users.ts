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

/* ---- Tenant members (auth-api) ---- */

export function useUsers(params?: ListParams) {
  return useQuery({
    queryKey: ["users", "list", params ?? {}],
    queryFn: () => usersApi.list(params),
  });
}

export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => usersApi.get(userId!),
    enabled: !!userId,
  });
}

/**
 * Create (invite) or update a member. Updates key off `user_id` (auth-api member
 * routes are user-scoped), passed via `data.user_id`.
 */
export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<ManagedUser> }) =>
      data.user_id ? usersApi.update(data.user_id, data) : usersApi.create(data),
    onSuccess: (res, v) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      const temp = (res as ManagedUser | undefined)?.temp_password;
      if (temp) {
        toast.success(`User added. Temporary password: ${temp}`, { duration: 15000 });
      } else {
        toast.success(v.data.user_id ? "User updated" : "User added");
      }
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save user")),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.remove(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove user")),
  });
}

/** User lifecycle/action mutations (activate/deactivate/suspend/reset password). */
export function useUserActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });
  const activate = useMutation({
    mutationFn: (userId: string) => usersApi.activate(userId),
    onSuccess: () => { invalidate(); toast.success("User activated"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to activate user")),
  });
  const deactivate = useMutation({
    mutationFn: (userId: string) => usersApi.deactivate(userId),
    onSuccess: () => { invalidate(); toast.success("User deactivated"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to deactivate user")),
  });
  const suspend = useMutation({
    mutationFn: (userId: string) => usersApi.suspend(userId),
    onSuccess: () => { invalidate(); toast.success("User suspended"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to suspend user")),
  });
  const resetPassword = useMutation({
    mutationFn: (userId: string) => usersApi.resetPassword(userId),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e) => toast.error(extractApiError(e, "Failed to reset password")),
  });
  /** Replace a member's role set (auth-api stores roles as strings on membership). */
  const setRoles = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      usersApi.setRoles(userId, roles),
    onSuccess: () => { invalidate(); toast.success("Roles updated"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to update roles")),
  });
  return { activate, deactivate, suspend, resetPassword, setRoles };
}

/* ---- Roles (curated string set — auth-api has no role table) ---- */

export function useRoles(_params?: ListParams) {
  return useQuery({ queryKey: ["roles", "list"], queryFn: () => rolesApi.list() });
}

/* ---- Permissions (REPORT: no auth-api endpoint — empty catalogue) ---- */

export function usePermissions(_params?: ListParams) {
  return useQuery({ queryKey: ["permissions", "list"], queryFn: () => permissionsApi.list() });
}

export type { ManagedUser, Permission, Role };
