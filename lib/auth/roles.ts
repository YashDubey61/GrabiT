import type { UserRole } from "@/types";

/** Route prefix each role is confined to. Source of truth for the
 * role → route allow-list that middleware.ts will enforce once wired
 * against a live `users.role` column (Day 2). */
export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  vendor: "/vendor",
  admin: "/admin",
};

export function isAuthorizedForPath(role: UserRole, pathname: string): boolean {
  return pathname.startsWith(ROLE_HOME[role]);
}
