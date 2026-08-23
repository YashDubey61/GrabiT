import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { VendorMenuScreen } from "@/components/student/VendorMenuScreen";
import { getLiveCanteenMenuItems, getLiveCanteenActiveOffers } from "@/lib/supabase/data";

// Server Component — live per-canteen shop detail page. Menu items and
// canteen metadata are fetched from Supabase (menu_items/canteens),
// keyed by the [canteenId] route param set by CanteenCard's link.
export default async function StudentCanteenMenuPage({
  params,
}: {
  params: Promise<{ canteenId: string }>;
}) {
  const { canteenId } = await params;
  // Offers are keyed off the same canteenId, not off canteenInfo — no
  // need to wait for the menu fetch to resolve before starting this one.
  const [{ canteenInfo, items }, offers] = await Promise.all([
    getLiveCanteenMenuItems(canteenId),
    getLiveCanteenActiveOffers(canteenId),
  ]);

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
      <VendorMenuScreen canteenInfo={canteenInfo} items={items} offers={offers} />
    </>
  );
}
