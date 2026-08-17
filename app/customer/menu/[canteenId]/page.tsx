import { MenuTopBar } from "@/components/student/MenuTopBar";
import { MenuInfoCard } from "@/components/student/MenuInfoCard";
import { MenuBrowser } from "@/components/student/MenuBrowser";
import { StudentRecommendationsSection } from "@/components/student/StudentRecommendationsSection";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { mockMenuCategories } from "@/lib/mock/menu";
import { getLiveCanteenMenuItems } from "@/lib/supabase/data";

// Server Component — live per-canteen shop detail page. Menu items and
// canteen metadata are fetched from Supabase (menu_items/canteens),
// keyed by the [canteenId] route param set by CanteenCard's link.
export default async function StudentCanteenMenuPage({
  params,
}: {
  params: Promise<{ canteenId: string }>;
}) {
  const { canteenId } = await params;
  const { canteenInfo, items } = await getLiveCanteenMenuItems(canteenId);

  if (!canteenInfo) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">storefront</span>
        <p className="font-display text-body-sm font-bold text-foreground">
          This vendor could not be found.
        </p>
        <p className="mt-1 font-body text-caption text-muted">
          It may have been removed or is no longer available.
        </p>
      </main>
    );
  }

  return (
    <>
      <TrackEventOnMount payload={{ eventName: "menu_viewed", canteenId: canteenInfo.id }} />
      <MenuTopBar title={canteenInfo.name} />

      <main className="mx-auto max-w-4xl px-5 pt-20 pb-32 md:px-16 md:pt-24">
        <MenuInfoCard
          avgPrepMinutes={canteenInfo.avgPrepMinutes}
          rating={canteenInfo.rating}
          ratingCount={canteenInfo.ratingCount}
          isOpen={canteenInfo.isOpen}
          description={canteenInfo.description}
        />

        <StudentRecommendationsSection />

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border-subtle bg-surface-elevated p-6 text-center text-body-sm text-muted">
            No food items are currently available at this canteen.
          </div>
        ) : (
          <MenuBrowser
            canteenId={canteenInfo.id}
            canteenName={canteenInfo.name}
            items={items}
            categories={mockMenuCategories}
          />
        )}
      </main>
    </>
  );
}
