import { CampusHeader } from "@/components/student/CampusHeader";
import { CanteenStatusBanner } from "@/components/student/CanteenStatusBanner";
import { CampusHomeBrowser } from "@/components/student/CampusHomeBrowser";
import { StudentRecommendationsSection } from "@/components/student/StudentRecommendationsSection";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { mockCanteenCategories, type MockCanteen } from "@/lib/mock/campus";
import { getLiveCampusDetails, getLiveCampusCanteens } from "@/lib/supabase/data";

// Server Component — fetching live Supabase data for Campus Home.
export default async function StudentHomePage() {
  let campus: { name: string; canteensOpen: number; estWaitMinutes: number };
  let canteens: MockCanteen[];
  let hasError = false;

  try {
    [campus, canteens] = await Promise.all([
      getLiveCampusDetails(),
      getLiveCampusCanteens(),
    ]);
  } catch (err) {
    console.error("Failed to load Supabase campus data:", err);
    hasError = true;
    campus = { name: "PSIT Kanpur", canteensOpen: 0, estWaitMinutes: 0 };
    canteens = [];
  }

  return (
    <>
      <TrackEventOnMount payload={{ eventName: "student_home_viewed" }} />
      <CampusHeader campusName={campus.name} />

      <main className="mx-auto max-w-2xl px-5 pt-20 pb-10 md:px-16 md:pt-24">
        <CanteenStatusBanner
          canteensOpen={campus.canteensOpen}
          estWaitMinutes={campus.estWaitMinutes}
        />

        <section className="mb-6 space-y-4">
          <h1 className="text-balance font-display text-[28px] font-700 leading-[1.2] tracking-tight text-foreground md:text-display">
            Fuel your <span className="italic text-primary">hustle.</span>
          </h1>

          <div className="group relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              placeholder="Search stalls or dishes..."
              aria-label="Search stalls or dishes"
              className="w-full rounded-xl border border-border-subtle bg-surface-elevated py-4 pl-12 pr-4 text-body text-foreground outline-none transition-all placeholder:text-muted focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </section>

        <StudentRecommendationsSection />

        {hasError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center text-body-sm text-foreground">
            <p className="font-bold text-danger">Unable to load canteens.</p>
            <p className="mt-1 text-muted">Please check your network connection and try again.</p>
          </div>
        ) : (
          <CampusHomeBrowser
            canteens={canteens}
            categories={mockCanteenCategories}
          />
        )}
      </main>
    </>
  );
}
