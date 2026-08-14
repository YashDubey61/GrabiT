import type { UserRole } from "@/types";

/** Route prefix each role is confined to. Source of truth for the
 * role → route allow-list that middleware.ts will enforce once wired
 * against a live `users.role` column (Day 2). */
// `admin` is the UserRole/DB identity (matches TRD's users.role enum —
// a technical/schema concept, left unchanged). The dashboard route and
// display label for that role are "Super Admin" / /superadmin, per the
// Day 3 product correction — see app/superadmin/layout.tsx.
export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  vendor: "/vendor",
  admin: "/superadmin",
};

export function isAuthorizedForPath(role: UserRole, pathname: string): boolean {
  return pathname.startsWith(ROLE_HOME[role]);
}
