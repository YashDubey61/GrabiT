import { StudentDashboardClient } from "@/components/student/StudentDashboardClient";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import {
  getLiveCampusList,
  getLiveCampusDetails,
  getLiveCampusCanteens,
  getLiveCampusFoodItems,
  type SupabaseCampus,
  type CampusFoodItem,
} from "@/lib/supabase/data";
import type { MockCanteen } from "@/lib/mock/campus";

// Server Component — fetching initial live Supabase data for Student Dashboard.
// No hardcoded campus/canteen fallback: a failed or empty fetch renders the
// dashboard's own empty state, not fabricated sample data.
export default async function StudentHomePage() {
  let initialCampuses: SupabaseCampus[] = [];
  let initialCampusDetails: {
    id: string;
    name: string;
    canteensOpen: number;
    estWaitMinutes: number;
  } | null = null;
  let initialCanteens: MockCanteen[] = [];
  let initialFoodItems: CampusFoodItem[] = [];

  try {
    const [campusList, details, canteens, foodItems] = await Promise.all([
      getLiveCampusList(),
      getLiveCampusDetails(),
      getLiveCampusCanteens(),
      getLiveCampusFoodItems(),
    ]);

    initialCampuses = campusList;
    initialCampusDetails = details;
    initialCanteens = canteens;
    initialFoodItems = foodItems;
  } catch (err) {
    console.error("Failed to load initial Supabase campus data:", err);
  }

  return (
    <>
      <TrackEventOnMount payload={{ eventName: "student_home_viewed" }} />
      <StudentDashboardClient
        initialCampuses={initialCampuses}
        initialCampusDetails={initialCampusDetails}
        initialCanteens={initialCanteens}
        initialFoodItems={initialFoodItems}
      />
    </>
  );
}
