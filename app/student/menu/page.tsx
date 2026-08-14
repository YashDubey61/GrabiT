import { MenuTopBar } from "@/components/student/MenuTopBar";
import { MenuInfoCard } from "@/components/student/MenuInfoCard";
import { MenuBrowser } from "@/components/student/MenuBrowser";
import { mockCanteenInfo, mockMenuCategories, mockMenuItems } from "@/lib/mock/menu";

// Server Component — converted from
// stitch_grabit_campus_canteen_os/grabit_menu_premium_black/code.html.
// Interactivity (category filter, cart) isolated to <MenuBrowser>.
export default function StudentMenuPage() {
  return (
    <>
      <MenuTopBar title={mockCanteenInfo.name} />

      <main className="mx-auto max-w-4xl px-5 pt-20 pb-32 md:px-16 md:pt-24">
        <MenuInfoCard
          avgPrepMinutes={mockCanteenInfo.avgPrepMinutes}
          rating={mockCanteenInfo.rating}
          ratingCount={mockCanteenInfo.ratingCount}
          isOpen={mockCanteenInfo.isOpen}
          description={mockCanteenInfo.description}
        />

        <MenuBrowser
          canteenName={mockCanteenInfo.name}
          items={mockMenuItems}
          categories={mockMenuCategories}
        />
      </main>
    </>
  );
}
