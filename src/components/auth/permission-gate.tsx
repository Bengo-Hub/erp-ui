"use client";

import { ReactNode } from "react";

import { useAppPermissions } from "@/hooks/use-app-permissions";

interface PermissionGateProps {
  /** A single permission, or a list. */
  permission?: string | string[];
  /** Require ALL listed permissions (default: ANY). */
  requireAll?: boolean;
  /** Required role(s). */
  role?: string | string[];
  children: ReactNode;
  /** Rendered when access is denied. Defaults to nothing. */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on the current user's RBAC.
 * Superusers / platform owners always pass (handled in useAppPermissions).
 */
export function PermissionGate({
  permission,
  requireAll = false,
  role,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions, roles, isSuperuser, isPlatformOwner } =
    useAppPermissions();

  let allowed = true;

  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    allowed = requireAll ? hasAllPermissions(perms) : hasAnyPermission(perms);
  }

  if (allowed && role) {
    const required = Array.isArray(role) ? role : [role];
    allowed = isSuperuser || isPlatformOwner || required.some((r) => roles.includes(r));
  }

  return <>{allowed ? children : fallback}</>;
}
