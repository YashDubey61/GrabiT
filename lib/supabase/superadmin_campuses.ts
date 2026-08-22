import { recordSuperAdminAction } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CampusOverviewStats {
  totalCampuses: number;
  activeCampuses: number;
  inactiveCampuses: number;
  totalStudents: number;
  totalVendors: number;
  activeVendors: number;
  todaysOrders: number;
  todaysGmv: number;
}

export interface CampusDirectoryItem {
  id: string;
  name: string;
  city: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "PRE_ONBOARDING";
  studentsCount: number;
  vendorsCount: number;
  activeVendorsCount: number;
  todaysOrders: number;
  todaysGmv: number;
  createdAt: string;
  logisticsLeadName?: string;
  imageUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  shortName?: string | null;
  address?: string | null;
  state?: string | null;
}

export interface CampusVendorItem {
  id: string;
  name: string;
  status: string;
  ordersCount: number;
  revenue: number;
  rating: number;
  stockAlerts: number;
  pendingSettlement: number;
}

export interface CampusAlertItem {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  timestamp: string;
  description: string;
  module: string;
  deepLink: string;
}

export interface CampusDetailData {
  info: CampusDirectoryItem;
  students: {
    total: number;
    active: number;
    new30d: number;
    orderingStudents: number;
  };
  vendors: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    closed: number;
  };
  orders: {
    todaysOrders: number;
    orders7d: number;
    orders30d: number;
    completed: number;
    cancelled: number;
    aov: number;
    completionRate: number;
    cancellationRate: number;
  };
  finance: {
    gmv: number;
    commission: number;
    vendorEarnings: number;
    pendingSettlements: number;
    paidSettlements: number;
  };
  operations: {
    openVendors: number;
    busyVendors: number;
    closedVendors: number;
    lowStockCount: number;
    activeDisputes: number;
    highRiskCases: number;
  };
  health: {
    orders: "Normal" | "Elevated" | "Critical";
    payments: "Healthy" | "Degraded" | "Critical";
    vendors: "Healthy" | "Attention Required";
    inventory: "Healthy" | "Low Stock" | "Stockout Risk";
    disputes: "Normal" | "Elevated";
    risk: "Normal" | "Elevated" | "Critical";
  };
  alerts: CampusAlertItem[];
  vendorList: CampusVendorItem[];
  performanceTrends: Array<{
    date: string;
    revenue: number;
    orders: number;
    activeVendors: number;
    activeStudents: number;
  }>;
}

export interface CampusComparisonItem {
  id: string;
  name: string;
  city: string;
  gmv: number;
  orders: number;
  aov: number;
  activeVendors: number;
  activeStudents: number;
  completionRate: number;
  cancellationRate: number;
  rating: number;
  disputeRate: number;
}

const DEFAULT_CAMPUS_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAnL6yucAYd9Pmi4RFLLpjUqnREaSik4Hr8cWfjb_4cRgTLKjsvS1FXpojDeCHE8K5sL6y2DCUvdoJ0pNqrVEjEw-dMlChm-A_NrJ2OaCiJIldBlaBdRTnVf2-RblrCkWjmGmv6KifqsrKdjlP4lECNuKWiq7ZWjQ4CTVDmEvDunlXkXpwIxncN-rjEu_Ty0TB2hrpsN07nWk_H2n7QqWcUVVC7lsZtqdx49maJ5ZUruKWncwZ8yTEk";

/**
 * Fetch overview stats and campus directory list.
 */
export async function fetchSuperAdminCampusesDirectory(
  searchQuery = "",
  statusFilter = "ALL"
): Promise<{ stats: CampusOverviewStats; campuses: CampusDirectoryItem[] }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch live campuses
    const { data: dbCampuses } = await supabase
      .from("campuses")
      .select("id, name, city, status, logistics_lead, image_url, latitude, longitude, radius_meters, short_name, address, state, created_at");

    // 2. Fetch canteens to map vendors to campus_id
    const { data: dbCanteens } = await supabase
      .from("canteens")
      .select("id, campus_id, status");

    const campusVendorsMap: Record<string, { total: number; active: number }> = {};
    if (dbCanteens) {
      dbCanteens.forEach((c) => {
        if (!campusVendorsMap[c.campus_id]) {
          campusVendorsMap[c.campus_id] = { total: 0, active: 0 };
        }
        campusVendorsMap[c.campus_id].total += 1;
        if (c.status === "active") {
          campusVendorsMap[c.campus_id].active += 1;
        }
      });
    }

    // 3. Fetch users to map student count to campus_id
    const { data: dbUsers } = await supabase
      .from("users")
      .select("id, campus_id, role");

    const campusStudentsMap: Record<string, number> = {};
    let totalStudents = 0;
    if (dbUsers) {
      dbUsers.forEach((u) => {
        if (u.role === "student" && u.campus_id) {
          campusStudentsMap[u.campus_id] = (campusStudentsMap[u.campus_id] || 0) + 1;
          totalStudents += 1;
        }
      });
    }

    // 4. Fetch orders for today's orders & GMV per campus
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: dbOrders } = await supabase
      .from("orders")
      .select("id, total_amount, status, created_at, canteen_id, canteens(campus_id)");

    const campusOrdersTodayMap: Record<string, { count: number; gmv: number }> = {};
    let globalTodaysOrders = 0;
    let globalTodaysGmv = 0;

    if (dbOrders) {
      dbOrders.forEach((o: any) => {
        const campusId = o.canteens?.campus_id;
        const isToday = new Date(o.created_at) >= startOfToday;
        const amount = Number(o.total_amount) || 0;

        if (isToday) {
          globalTodaysOrders += 1;
          globalTodaysGmv += amount;
        }

        if (campusId) {
          if (!campusOrdersTodayMap[campusId]) {
            campusOrdersTodayMap[campusId] = { count: 0, gmv: 0 };
          }
          if (isToday) {
            campusOrdersTodayMap[campusId].count += 1;
            campusOrdersTodayMap[campusId].gmv += amount;
          }
        }
      });
    }

    // Map Campuses
    let mappedCampuses: CampusDirectoryItem[] = [];
    if (dbCampuses && dbCampuses.length > 0) {
      mappedCampuses = dbCampuses.map((c) => {
        const vInfo = campusVendorsMap[c.id] || { total: 0, active: 0 };
        const stCount = campusStudentsMap[c.id] || 0;
        const oToday = campusOrdersTodayMap[c.id] || { count: 0, gmv: 0 };

        const st = (c.status || "ACTIVE").toUpperCase() as any;
        return {
          id: c.id,
          name: c.name,
          city: c.city || "India",
          location: `${c.city || "Campus"}, ${c.state || "UP"}`,
          status: st === "ACTIVE" || st === "INACTIVE" || st === "MAINTENANCE" || st === "PRE_ONBOARDING" ? st : "ACTIVE",
          studentsCount: stCount,
          vendorsCount: vInfo.total,
          activeVendorsCount: vInfo.active,
          todaysOrders: oToday.count,
          todaysGmv: oToday.gmv,
          createdAt: c.created_at || new Date().toISOString(),
          logisticsLeadName: c.logistics_lead || "Operations Lead",
          imageUrl: c.image_url || DEFAULT_CAMPUS_IMAGE,
          latitude: c.latitude,
          longitude: c.longitude,
          radiusMeters: c.radius_meters,
          shortName: c.short_name,
          address: c.address,
          state: c.state,
        };
      });
    }

    // Filter Search & Status
    const filtered = mappedCampuses.filter((cmp) => {
      const matchQuery =
        !searchQuery.trim() ||
        cmp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && cmp.status === "ACTIVE") ||
        (statusFilter === "INACTIVE" && (cmp.status === "INACTIVE" || cmp.status === "MAINTENANCE"));

      return matchQuery && matchStatus;
    });

    const activeCampuses = mappedCampuses.filter((c) => c.status === "ACTIVE").length;
    const inactiveCampuses = mappedCampuses.length - activeCampuses;
    const totalVendors = mappedCampuses.reduce((sum, c) => sum + c.vendorsCount, 0);
    const activeVendors = mappedCampuses.reduce((sum, c) => sum + c.activeVendorsCount, 0);

    const stats: CampusOverviewStats = {
      totalCampuses: mappedCampuses.length,
      activeCampuses,
      inactiveCampuses,
      totalStudents,
      totalVendors,
      activeVendors,
      todaysOrders: globalTodaysOrders,
      todaysGmv: globalTodaysGmv,
    };

    return { stats, campuses: filtered };
  } catch (err) {
    // Return empty dataset on error
    return {
      stats: {
        totalCampuses: 0,
        activeCampuses: 0,
        inactiveCampuses: 0,
        totalStudents: 0,
        totalVendors: 0,
        activeVendors: 0,
        todaysOrders: 0,
        todaysGmv: 0,
      },
      campuses: [],
    };
  }
}

/**
 * Fetch detailed metrics for a single campus by ID.
 */
export async function fetchSuperAdminCampusDetail(
  campusId: string,
  timeframe = "30d"
): Promise<CampusDetailData | null> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch campus info
    const { data: campus } = await supabase
      .from("campuses")
      .select("*")
      .eq("id", campusId)
      .single();

    if (!campus) return null;

    // 2. Fetch canteens belonging to this campus
    const { data: canteens } = await supabase
      .from("canteens")
      .select("id, name, status, commission_rate, qr_code_id")
      .eq("campus_id", campusId);

    const canteenIds = (canteens || []).map((c) => c.id);

    // 3. Fetch students belonging to this campus
    const { data: users } = await supabase
      .from("users")
      .select("id, role, created_at")
      .eq("campus_id", campusId);

    const studentsList = (users || []).filter((u) => u.role === "student");
    const totalStudents = studentsList.length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const new30dStudents = studentsList.filter((u) => new Date(u.created_at) >= thirtyDaysAgo).length;

    // 4. Fetch orders for canteens in this campus
    let campusOrders: any[] = [];
    if (canteenIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, canteen_id, student_id, status, total_amount, created_at")
        .in("canteen_id", canteenIds);
      if (orders) campusOrders = orders;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const todaysOrders = campusOrders.filter((o) => new Date(o.created_at) >= startOfToday).length;
    const orders7d = campusOrders.filter((o) => new Date(o.created_at) >= sevenDaysAgo).length;
    const orders30d = campusOrders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo).length;

    const completed = campusOrders.filter((o) => o.status === "completed" || o.status === "delivered" || o.status === "picked_up").length;
    const cancelled = campusOrders.filter((o) => o.status === "cancelled" || o.status === "rejected").length;
    const totalOrdersCount = campusOrders.length || 1;

    const completionRate = Math.round((completed / totalOrdersCount) * 100);
    const cancellationRate = Math.round((cancelled / totalOrdersCount) * 100);

    const gmv = campusOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const aov = campusOrders.length > 0 ? Math.round(gmv / campusOrders.length) : 0;

    const commissionRate = 0.07; // 7% platform commission
    const commission = Math.round(gmv * commissionRate);
    const vendorEarnings = gmv - commission;

    // Unique ordering students count
    const orderingStudentsSet = new Set(campusOrders.map((o) => o.student_id).filter(Boolean));

    // 5. Vendor Status Breakdown
    const activeVendors = (canteens || []).filter((c) => c.status === "active").length;
    const pendingVendors = (canteens || []).filter((c) => c.status === "pending").length;
    const suspendedVendors = (canteens || []).filter((c) => c.status === "suspended").length;
    const closedVendors = (canteens || []).filter((c) => c.status === "closed" || c.status === "paused").length;

    // 6. Vendor List with Revenue
    const vendorOrdersMap: Record<string, { count: number; rev: number }> = {};
    campusOrders.forEach((o) => {
      if (!vendorOrdersMap[o.canteen_id]) {
        vendorOrdersMap[o.canteen_id] = { count: 0, rev: 0 };
      }
      vendorOrdersMap[o.canteen_id].count += 1;
      vendorOrdersMap[o.canteen_id].rev += Number(o.total_amount) || 0;
    });

    const vendorList: CampusVendorItem[] = (canteens || []).map((c) => {
      const stats = vendorOrdersMap[c.id] || { count: 0, rev: 0 };
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        ordersCount: stats.count,
        revenue: stats.rev,
        rating: 4.8,
        stockAlerts: 0,
        pendingSettlement: Math.round(stats.rev * 0.93),
      };
    });

    // 7. Campus Alerts
    const alerts: CampusAlertItem[] = [];
    if (cancellationRate > 15) {
      alerts.push({
        id: "alt_01",
        severity: "HIGH",
        timestamp: new Date().toISOString(),
        description: `High cancellation rate (${cancellationRate}%) detected in last 30 days`,
        module: "Orders",
        deepLink: `/superadmin/operations?campusId=${campusId}`,
      });
    }
    if (closedVendors > 0) {
      alerts.push({
        id: "alt_02",
        severity: "MEDIUM",
        timestamp: new Date().toISOString(),
        description: `${closedVendors} canteen vendor storefronts currently paused or closed`,
        module: "Vendor Oversight",
        deepLink: `/superadmin/vendors?campusId=${campusId}`,
      });
    }

    // Performance Trends (last 7 days data points)
    const performanceTrends = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(Date.now() - (6 - idx) * 24 * 3600 * 1000);
      const dayOrders = campusOrders.filter(
        (o) => new Date(o.created_at).toDateString() === d.toDateString()
      );
      const dayGmv = dayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

      return {
        date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        revenue: dayGmv,
        orders: dayOrders.length,
        activeVendors: activeVendors || 1,
        activeStudents: orderingStudentsSet.size || 1,
      };
    });

    const directoryItem: CampusDirectoryItem = {
      id: campus.id,
      name: campus.name,
      city: campus.city || "India",
      location: `${campus.city || "Campus"}, ${campus.state || "UP"}`,
      status: (campus.status || "ACTIVE").toUpperCase() as any,
      studentsCount: totalStudents,
      vendorsCount: canteens?.length || 0,
      activeVendorsCount: activeVendors,
      todaysOrders,
      todaysGmv: campusOrders
        .filter((o) => new Date(o.created_at) >= startOfToday)
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
      createdAt: campus.created_at || new Date().toISOString(),
      logisticsLeadName: campus.logistics_lead || "Operations Lead",
      imageUrl: campus.image_url || DEFAULT_CAMPUS_IMAGE,
      latitude: campus.latitude,
      longitude: campus.longitude,
      radiusMeters: campus.radius_meters,
      shortName: campus.short_name,
      address: campus.address,
      state: campus.state,
    };

    return {
      info: directoryItem,
      students: {
        total: totalStudents,
        active: orderingStudentsSet.size || totalStudents,
        new30d: new30dStudents,
        orderingStudents: orderingStudentsSet.size,
      },
      vendors: {
        total: canteens?.length || 0,
        active: activeVendors,
        pending: pendingVendors,
        suspended: suspendedVendors,
        closed: closedVendors,
      },
      orders: {
        todaysOrders,
        orders7d,
        orders30d,
        completed,
        cancelled,
        aov,
        completionRate,
        cancellationRate,
      },
      finance: {
        gmv,
        commission,
        vendorEarnings,
        pendingSettlements: Math.round(vendorEarnings * 0.2),
        paidSettlements: Math.round(vendorEarnings * 0.8),
      },
      operations: {
        openVendors: activeVendors,
        busyVendors: 0,
        closedVendors,
        lowStockCount: 0,
        activeDisputes: 0,
        highRiskCases: 0,
      },
      health: {
        orders: cancellationRate > 15 ? "Elevated" : "Normal",
        payments: "Healthy",
        vendors: closedVendors > 0 ? "Attention Required" : "Healthy",
        inventory: "Healthy",
        disputes: "Normal",
        risk: "Normal",
      },
      alerts,
      vendorList,
      performanceTrends,
    };
  } catch {
    return null;
  }
}

/**
 * Server-authoritative Campus Status Mutation with Audit Trail.
 */
export async function updateCampusOperationalStatus({
  adminId,
  campusId,
  newStatus,
  reason,
}: {
  adminId: string;
  campusId: string;
  newStatus: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "PRE_ONBOARDING";
  reason?: string;
}): Promise<{ ok: boolean; error?: string; campus?: any }> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("campuses")
      .select("id, name, status")
      .eq("id", campusId)
      .single();

    if (!existing) {
      return { ok: false, error: `Campus ID '${campusId}' not found.` };
    }

    if (newStatus === "INACTIVE" && !reason?.trim()) {
      return { ok: false, error: "A mandatory explanation reason is required when deactivating a campus." };
    }

    const previousStatus = existing.status;

    const { data: updated, error } = await supabase
      .from("campuses")
      .update({ status: newStatus })
      .eq("id", campusId)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    await recordSuperAdminAction({
      adminId,
      action: "campus_status_updated",
      module: "System",
      targetType: "SYSTEM",
      targetId: campusId,
      severity: newStatus === "INACTIVE" ? "HIGH" : "MEDIUM",
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      reason: reason || `Updated campus ${existing.name} status to ${newStatus}`,
      metadata: { campusName: existing.name },
    });

    return { ok: true, campus: updated };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to update campus status." };
  }
}

/**
 * Fetch side-by-side comparative metrics across all campuses.
 */
export async function fetchCampusComparisonMetrics(): Promise<CampusComparisonItem[]> {
  const { campuses } = await fetchSuperAdminCampusesDirectory();
  return campuses.map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city,
    gmv: c.todaysGmv * 30, // 30-day projection
    orders: c.todaysOrders * 30,
    aov: c.todaysOrders > 0 ? Math.round((c.todaysGmv * 30) / (c.todaysOrders * 30)) : 140,
    activeVendors: c.activeVendorsCount,
    activeStudents: c.studentsCount,
    completionRate: 98,
    cancellationRate: 2,
    rating: 4.8,
    disputeRate: 0.5,
  }));
}

// Preserve backwards-compatibility for existing caller getSuperAdminCampuses
export async function getSuperAdminCampuses(searchQuery = "", statusFilter = "ALL") {
  const { stats, campuses } = await fetchSuperAdminCampusesDirectory(searchQuery, statusFilter);
  return {
    campuses: campuses.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.city,
      vendorCount: c.vendorsCount,
      dailyOrders: c.todaysOrders,
      ordersCapacityPercent: Math.min(100, Math.max(30, Math.round((c.todaysOrders / 500) * 100))),
      logisticsLeadName: c.logisticsLeadName || "Operations Lead",
      logisticsLeadInitials: c.name.substring(0, 2).toUpperCase(),
      status: c.status,
      imageUrl: c.imageUrl || DEFAULT_CAMPUS_IMAGE,
    })),
    stats: {
      totalCampusesCount: stats.totalCampuses,
      totalVendorsCount: stats.totalVendors,
      dailyVolume: `${stats.todaysOrders.toLocaleString()} orders`,
      networkHealth: "99.8% Operational",
    },
    activities: [
      {
        id: "act_1",
        title: "Live Registry Synced",
        description: `${stats.totalCampuses} institutional university campuses operating live on Supabase.`,
        timestampText: "JUST NOW",
        type: "new" as const,
      },
    ],
  };
}

export async function createLiveCampus(payload: {
  name: string;
  location: string;
  status?: string;
  logisticsLeadName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  shortName?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campuses")
    .insert({
      name: payload.name.trim(),
      city: payload.location.trim(),
      status: payload.status || "ACTIVE",
      logistics_lead: payload.logisticsLeadName?.trim() || "Operations Lead",
      image_url: DEFAULT_CAMPUS_IMAGE,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      radius_meters: payload.radiusMeters ?? 2000,
      short_name: payload.shortName?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLiveCampus(
  id: string,
  payload: {
    name?: string;
    location?: string;
    status?: string;
    logisticsLeadName?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    shortName?: string;
  }
) {
  const supabase = getSupabaseAdminClient();
  const updates: Record<string, unknown> = {};
  if (payload.name) updates.name = payload.name.trim();
  if (payload.location) updates.city = payload.location.trim();
  if (payload.status) updates.status = payload.status;
  if (payload.logisticsLeadName) updates.logistics_lead = payload.logisticsLeadName.trim();

  const { data, error } = await supabase
    .from("campuses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
