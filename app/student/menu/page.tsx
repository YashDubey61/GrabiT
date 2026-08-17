import { redirect } from "next/navigation";

// Canteen-scoped browsing lives at /student/menu/[canteenId]; this route
// has no canteen context of its own, so send students to pick one from
// the live campus home list instead of showing stale mock data.
export default function StudentMenuIndexPage() {
  redirect("/student");
}
