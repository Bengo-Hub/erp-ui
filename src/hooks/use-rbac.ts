"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { rbacApi } from "@/lib/api/rbac";
import { extractApiError } from "@/lib/api/error";

const ROLES = ["rbac", "roles"] as const;
const PERMS = ["rbac", "permissions"] as const;

export function usePermissions() {
  return useQuery({ queryKey: PERMS, queryFn: () => rbacApi.listPermissions() });
}

export function useRoles() {
  return useQuery({ queryKey: ROLES, queryFn: () => rbacApi.listRoles() });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: [...ROLES, id],
    queryFn: () => rbacApi.getRole(id as string),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { role_code: string; name: string; description?: string }) =>
      rbacApi.createRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES });
      toast.success("Role created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to create role")),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      rbacApi.updateRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update role")),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rbacApi.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES });
      toast.success("Role deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete role")),
  });
}

export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, codes }: { id: string; codes: string[] }) =>
      rbacApi.setRolePermissions(id, codes),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ROLES });
      qc.invalidateQueries({ queryKey: [...ROLES, vars.id] });
      toast.success("Permissions updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update permissions")),
  });
}
