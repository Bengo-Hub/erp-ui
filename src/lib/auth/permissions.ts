import type { UserProfile } from "./types";

type Operator = "and" | "or";

export function userHasRole(
  user: UserProfile | null,
  roles?: string[] | null,
  operator: Operator = "or",
): boolean {
  if (!roles?.length) return true;
  if (!user) return false;
  if (user.isSuperUser || user.roles.includes("superuser")) return true;
  const matches = roles.map((r) => user.roles.includes(r));
  return operator === "and" ? matches.every(Boolean) : matches.some(Boolean);
}

export function userHasPermission(
  user: UserProfile | null,
  permissions?: string[] | null,
  operator: Operator = "or",
): boolean {
  if (!permissions?.length) return true;
  if (!user) return false;
  if (user.isSuperUser || user.roles.includes("superuser")) return true;
  if (user.isPlatformOwner) return true;
  const matches = permissions.map((p) => user.permissions.includes(p));
  return operator === "and" ? matches.every(Boolean) : matches.some(Boolean);
}

export function userCanAccess(
  user: UserProfile | null,
  options: {
    roles?: string[] | null;
    permissions?: string[] | null;
    roleOperator?: Operator;
    permissionOperator?: Operator;
  } = {},
): boolean {
  const { roles, permissions, roleOperator = "or", permissionOperator = "or" } = options;
  return (
    userHasRole(user, roles, roleOperator) &&
    userHasPermission(user, permissions, permissionOperator)
  );
}
