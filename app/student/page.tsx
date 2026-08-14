import { CampusHeader } from "@/components/student/CampusHeader";
import { CanteenStatusBanner } from "@/components/student/CanteenStatusBanner";
import { CampusHomeBrowser } from "@/components/student/CampusHomeBrowser";
import { mockCampus, mockCanteenCategories, mockCanteens } from "@/lib/mock/campus";

// Server Component — no client JS beyond the CampusHomeBrowser island.
// Converted from stitch_grabit_campus_canteen_os/grabit_campus_home_premium_black/code.html.
export default function StudentHomePage() {
  return (
    <>
      <CampusHeader campusName={mockCampus.name} />

      <main className="mx-auto max-w-2xl px-5 pt-20 pb-10 md:px-16 md:pt-24">
        <CanteenStatusBanner
          canteensOpen={mockCampus.canteensOpen}
          estWaitMinutes={mockCampus.estWaitMinutes}
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

        <CampusHomeBrowser
          canteens={mockCanteens}
          categories={mockCanteenCategories}
        />
      </main>
    </>
  );
}
