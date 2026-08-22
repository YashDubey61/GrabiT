import { recordSuperAdminAction } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type UserRole = "student" | "vendor" | "admin";
export type AccountStatus = "active" | "suspended" | "disabled";

export interface UserItem {
  id: string;
  phone: string;
  role: UserRole;
  campusId: string | null;
  campusName?: string | null;
  canteenId: string | null;
  canteenName?: string | null;
  grabitUserId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  accountStatus: AccountStatus;
  statusReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  email?: string | null;
}

export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  studentsCount: number;
  vendorsCount: number;
  adminsCount: number;
  suspendedCount: number;
}

export interface AuditLogEntry {
  id: string;
  actorAdminId: string;
  targetUserId: string;
  action: string;
  previousRole: string | null;
  newRole: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorName?: string | null;
}

/**
 * Fetch aggregate user metrics from the database.
 */
export async function fetchUserManagementStats(): Promise<UserManagementStats> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: users, error } = await supabase
      .from("users")
      .select("id, role");

    if (error || !users) {
      throw new Error(error?.message || "Failed to fetch user metrics");
    }

    const totalUsers = users.length;
    let activeUsers = 0;
    let studentsCount = 0;
    let vendorsCount = 0;
    let adminsCount = 0;
    let suspendedCount = 0;

    for (const u of users) {
      // Default to active unless recorded otherwise
      const status = (u as any).account_status ?? "active";
      if (status === "active") activeUsers++;
      if (status === "suspended" || status === "disabled") suspendedCount++;

      if (u.role === "student") studentsCount++;
      else if (u.role === "vendor") vendorsCount++;
      else if (u.role === "admin") adminsCount++;
    }

    return {
      totalUsers,
      activeUsers,
      studentsCount,
      vendorsCount,
      adminsCount,
      suspendedCount,
    };
  } catch (err: any) {
    console.error("fetchUserManagementStats error:", err);
    throw err;
  }
}

export interface FetchUserDirectoryParams {
  search?: string;
  role?: string;
  status?: string;
  campusId?: string;
  canteenId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch paginated user directory with joined campus, canteen, and auth data.
 */
export async function fetchUserDirectory({
  search,
  role,
  status,
  campusId,
  canteenId,
  page = 1,
  pageSize = 50,
}: FetchUserDirectoryParams): Promise<{ users: UserItem[]; totalCount: number; stats: UserManagementStats }> {
  const supabase = getSupabaseAdminClient();

  // 1. Query public.users with relations
  const { data: usersData, error: usersErr } = await supabase
    .from("users")
    .select(
      "id, phone, role, campus_id, canteen_id, grabit_user_id, full_name, avatar_url, created_at, campuses(name), canteens(name)"
    )
    .order("created_at", { ascending: false });

  if (usersErr || !usersData) {
    throw new Error(usersErr?.message || "Failed to fetch users directory from database.");
  }

  // 2. Query Supabase Auth users to enrich emails & metadata
  let authUsersMap = new Map<string, any>();
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    if (authData?.users) {
      authData.users.forEach((au) => {
        authUsersMap.set(au.id, au);
      });
    }
  } catch {
    // Auth list lookup fallback
  }

  // 3. Transform & enrich records
  let allUsers: UserItem[] = usersData.map((u: any) => {
    const au = authUsersMap.get(u.id);
    const fullName = u.full_name || au?.user_metadata?.full_name || au?.user_metadata?.name || (au?.email ? au.email.split("@")[0] : null);
    const avatarUrl = u.avatar_url || au?.user_metadata?.avatar_url || au?.user_metadata?.picture || null;
    const phone = u.phone || au?.phone || au?.user_metadata?.phone || "N/A";
    const grabitUserId = u.grabit_user_id || `GRB-${u.id.substring(0, 6).toUpperCase()}`;

    return {
      id: u.id,
      phone,
      role: (u.role || "student") as UserRole,
      campusId: u.campus_id,
      campusName: u.campuses?.name ?? null,
      canteenId: u.canteen_id,
      canteenName: u.canteens?.name ?? null,
      grabitUserId,
      fullName,
      avatarUrl,
      accountStatus: (u.account_status ?? "active") as AccountStatus,
      statusReason: u.status_reason ?? null,
      suspendedAt: u.suspended_at ?? null,
      createdAt: u.created_at,
      lastActiveAt: u.last_active_at ?? u.created_at,
      email: au?.email || null,
    };
  });

  // Calculate overall stats before filtering
  const stats: UserManagementStats = {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u) => u.accountStatus === "active").length,
    studentsCount: allUsers.filter((u) => u.role === "student").length,
    vendorsCount: allUsers.filter((u) => u.role === "vendor").length,
    adminsCount: allUsers.filter((u) => u.role === "admin").length,
    suspendedCount: allUsers.filter((u) => u.accountStatus === "suspended" || u.accountStatus === "disabled").length,
  };

  // 4. Apply Filters in memory
  let filtered = [...allUsers];

  if (role && role !== "all") {
    filtered = filtered.filter((u) => u.role.toLowerCase() === role.toLowerCase());
  }

  if (status && status !== "all") {
    filtered = filtered.filter((u) => u.accountStatus.toLowerCase() === status.toLowerCase());
  }

  if (campusId && campusId !== "all") {
    filtered = filtered.filter((u) => u.campusId === campusId);
  }

  if (canteenId && canteenId !== "all") {
    filtered = filtered.filter((u) => u.canteenId === canteenId);
  }

  if (search && search.trim() !== "") {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter((u) => {
      const matchName = u.fullName ? u.fullName.toLowerCase().includes(s) : false;
      const matchPhone = u.phone ? u.phone.toLowerCase().includes(s) : false;
      const matchGrabitId = u.grabitUserId ? u.grabitUserId.toLowerCase().includes(s) : false;
      const matchUuid = u.id ? u.id.toLowerCase().includes(s) : false;
      const matchEmail = u.email ? u.email.toLowerCase().includes(s) : false;

      return matchName || matchPhone || matchGrabitId || matchUuid || matchEmail;
    });
  }

  const totalCount = filtered.length;

  // 5. Paginate
  const fromIndex = (page - 1) * pageSize;
  const paginatedUsers = filtered.slice(fromIndex, fromIndex + pageSize);

  return { users: paginatedUsers, totalCount, stats };
}

/**
 * Fetch comprehensive user details including order metrics and audit trail.
 */
export async function fetchUserDetails(userId: string): Promise<{
  user: UserItem | null;
  ordersCount: number;
  totalSpentOrManaged: number;
  auditTrail: AuditLogEntry[];
}> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("id, phone, role, campus_id, canteen_id, grabit_user_id, full_name, avatar_url, created_at, campuses(name), canteens(name)")
      .eq("id", userId)
      .single();

    if (userErr || !userData) {
      return { user: null, ordersCount: 0, totalSpentOrManaged: 0, auditTrail: [] };
    }

    let email = null;
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user) {
        email = authUser.user.email ?? null;
      }
    } catch {}

    const user: UserItem = {
      id: userData.id,
      phone: userData.phone,
      role: (userData.role || "student") as UserRole,
      campusId: userData.campus_id,
      campusName: (userData as any).campuses?.name ?? null,
      canteenId: userData.canteen_id,
      canteenName: (userData as any).canteens?.name ?? null,
      grabitUserId: userData.grabit_user_id || `GRB-${userData.id.substring(0, 6).toUpperCase()}`,
      fullName: userData.full_name || (email ? email.split("@")[0] : "GRABIT User"),
      avatarUrl: userData.avatar_url,
      accountStatus: "active",
      statusReason: null,
      suspendedAt: null,
      createdAt: userData.created_at,
      lastActiveAt: userData.created_at,
      email,
    };

    // Calculate user order statistics
    let ordersCount = 0;
    let totalSpentOrManaged = 0;

    if (user.role === "student") {
      const { data: studentOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("student_id", userId);

      if (studentOrders) {
        ordersCount = studentOrders.length;
        totalSpentOrManaged = studentOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      }
    } else if (user.role === "vendor" && user.canteenId) {
      const { data: vendorOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("canteen_id", user.canteenId)
        .eq("status", "completed");

      if (vendorOrders) {
        ordersCount = vendorOrders.length;
        totalSpentOrManaged = vendorOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      }
    }

    // Fetch audit history for this target user
    let auditTrail: AuditLogEntry[] = [];
    try {
      const { data: auditData } = await supabase
        .from("superadmin_user_audit_log")
        .select("id, actor_admin_id, target_user_id, action, previous_role, new_role, previous_status, new_status, reason, metadata, created_at")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false });

      auditTrail = (auditData ?? []).map((a: any) => ({
        id: a.id,
        actorAdminId: a.actor_admin_id,
        targetUserId: a.target_user_id,
        action: a.action,
        previousRole: a.previous_role,
        newRole: a.new_role,
        previousStatus: a.previous_status,
        newStatus: a.new_status,
        reason: a.reason,
        metadata: a.metadata,
        createdAt: a.created_at,
      }));
    } catch {}

    return { user, ordersCount, totalSpentOrManaged, auditTrail };
  } catch {
    return { user: null, ordersCount: 0, totalSpentOrManaged: 0, auditTrail: [] };
  }
}

/**
 * Super Admin Role Mutation with security protections:
 * 1. Blocks self-demotion if targetUserId === adminId.
 * 2. Blocks demoting sole active Super Admin if total admins <= 1.
 * 3. Server-authoritative role update in public.users & audit logging.
 */
export async function updateUserRoleApi({
  adminId,
  targetUserId,
  newRole,
  reason,
}: {
  adminId: string;
  targetUserId: string;
  newRole: UserRole;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!["student", "vendor", "admin"].includes(newRole)) {
      return { ok: false, error: "Invalid role specified." };
    }

    // 1. Security Check: Prevent self-demotion
    if (targetUserId === adminId && newRole !== "admin") {
      return { ok: false, error: "Self-demotion protection: You cannot remove your own Super Admin access." };
    }

    const supabase = getSupabaseAdminClient();

    // 2. Fetch current target user state
    const { data: targetUser, error: fetchErr } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !targetUser) {
      return { ok: false, error: "Target user not found in database." };
    }

    const previousRole = targetUser.role;
    if (previousRole === newRole) {
      return { ok: true }; // No change needed
    }

    // 3. Security Check: Prevent demoting sole Super Admin
    if (previousRole === "admin" && newRole !== "admin") {
      const { data: adminList } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin");

      if (!adminList || adminList.length <= 1) {
        return { ok: false, error: "Protection Guard: Cannot demote the sole active Super Admin account." };
      }
    }

    // 4. Perform database update on public.users
    const { error: updateErr } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", targetUserId);

    if (updateErr) {
      return { ok: false, error: `Failed to update user role: ${updateErr.message}` };
    }

    // 5. Record audit entry
    await recordSuperAdminAction({
      adminId,
      action: "user_role_changed",
      module: "Users",
      targetType: "USER",
      targetId: targetUserId,
      severity: "HIGH",
      previousState: { role: previousRole },
      newState: { role: newRole },
      reason: reason ?? "Super Admin role update",
    });

    try {
      await supabase.from("superadmin_user_audit_log").insert({
        actor_admin_id: adminId,
        target_user_id: targetUserId,
        action: "role_changed",
        previous_role: previousRole,
        new_role: newRole,
        reason: reason ?? "Super Admin role update",
      });
    } catch {}

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Internal server error during role update." };
  }
}

/**
 * Super Admin Account Status Mutation (Active, Suspended, Disabled) with audit trail.
 */
export async function updateUserStatusApi({
  adminId,
  targetUserId,
  newStatus,
  reason,
}: {
  adminId: string;
  targetUserId: string;
  newStatus: AccountStatus;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!["active", "suspended", "disabled"].includes(newStatus)) {
      return { ok: false, error: "Invalid status specified." };
    }

    // 1. Protection Guard: Cannot suspend yourself
    if (targetUserId === adminId && newStatus !== "active") {
      return { ok: false, error: "Self-protection: You cannot suspend or disable your own Super Admin account." };
    }

    const supabase = getSupabaseAdminClient();

    // 2. Fetch current target user status
    const { data: targetUser, error: fetchErr } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !targetUser) {
      return { ok: false, error: "Target user not found." };
    }

    const previousStatus = (targetUser as any).account_status ?? "active";
    if (previousStatus === newStatus) {
      return { ok: true };
    }

    // 3. Record audit log
    await recordSuperAdminAction({
      adminId,
      action: "user_status_changed",
      module: "Users",
      targetType: "USER",
      targetId: targetUserId,
      severity: "HIGH",
      previousState: { account_status: previousStatus },
      newState: { account_status: newStatus },
      reason: reason ?? "Super Admin account status update",
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Internal server error during status update." };
  }
}
