import type { UserRole } from "@/types";

/** Route prefix each role is confined to. Source of truth for the
 * role → route allow-list that middleware.ts enforces. */
export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  vendor: "/vendor",
  admin: "/superadmin",
};

/** Authentication entry point dedicated for each role. */
export const ROLE_AUTH_PATH: Record<UserRole, string> = {
  student: "/auth",
  vendor: "/vendor/auth",
  admin: "/superadmin/auth",
};

export function isAuthorizedForPath(role: UserRole, pathname: string): boolean {
  return pathname.startsWith(ROLE_HOME[role]);
}
