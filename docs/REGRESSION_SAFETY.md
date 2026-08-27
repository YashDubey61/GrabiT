# GRABIT — Regression Safety & Architecture Checkpoint

> **CRITICAL RULE FOR ALL FUTURE AI AGENTS & DEVELOPERS:**
> This document is the permanent source of truth for all verified fixes, architecture boundaries, and protected behaviors in the GRABIT repository.
> **DO NOT** revert, reset, overwrite, or refactor any of these protected implementations without explicitly verifying all regression test suites.

---

## 1. Architectural Role Separation (STRICT)

GRABIT has three distinct, isolated application surfaces. **NEVER MERGE OR CROSS-POLLUTE THESE SURFACES:**

1. **Student Application**:
   - **Routes**: `/customer/*`, `/student` (redirects to `/customer`)
   - **Layout Shell**: `app/customer/layout.tsx`
   - **Primary Client**: `components/student/StudentDashboardClient.tsx`
   - **State**: `lib/cart/CartContext.tsx`, `lib/orders/OrderContext.tsx`
   - **Mobile App**: Capacitor App ID `app.grabit.student` (`android/`)

2. **Vendor Application**:
   - **Routes**: `/vendor/*` (Dashboard, Live Orders, Menu, Inventory, Payouts, Offers, Reviews, Analytics, Settings)
   - **Auth Page**: `/vendor/auth` (isolated from navigation rail/tabbar)
   - **Layout Shell**: `app/vendor/layout.tsx`
   - **State**: `lib/vendor/VendorContext.tsx`
   - **Mobile App**: `vendor-mobile/`

3. **Super Admin Command Center**:
   - **Routes**: `/superadmin/*` (30+ operational modules, finance, risk, incidents, campus management)
   - **Auth Page**: `/superadmin/auth`
   - **Layout Shell**: `app/superadmin/layout.tsx`

---

## 2. Protected Bug Fixes & Regression Registry

### [PROTECTED FIX 1] Native Offline Fallback & Reconnect Flow
- **Original Bug**: Android WebView got stuck on the native `offline.html` screen. Tapping "Retry" failed with *"Still offline"*, permanently trapping the user.
- **Root Cause**:
  1. `adb reverse tcp:3000 tcp:3000` was not persistent, causing local dev connections to fail with `ERR_CONNECTION_REFUSED`.
  2. `public/offline.html` contained a blocking `if (navigator.onLine === false)` check. In Android WebView on `file:///` URLs, `navigator.onLine` returns `false` regardless of actual network status, preventing the Retry handler from executing.
- **Fix Implemented**:
  - In `public/offline.html`: Removed `navigator.onLine` block; added real `probeServer()` function with 2-second timeout targeting `/api/health` and `/favicon.ico`; added 2.5s auto-polling loop that auto-reconnects as soon as host is reachable.
  - In `components/shared/OfflineOverlay.tsx`: Added `isDismissed` state and fast local health check.
- **Key Files**: `public/offline.html`, `components/shared/OfflineOverlay.tsx`, `android/app/src/main/java/app/grabit/student/MainActivity.java`.
- **Verification**: `adb shell "curl -I http://localhost:3000/api/health"` returns HTTP 200; tapping Retry in `offline.html` navigates back to `/customer`.

---

### [PROTECTED FIX 2] Glassmorphism / Marble Shader Background Scope
- **Original Bug**: WebGL Smokey / marble background appeared too globally across non-dashboard pages (e.g. login/auth forms).
- **Root Cause**: `AnimatedBackground` was directly imported into auth pages (`/auth`, `/vendor/auth`, `/superadmin/auth`).
- **Fix Implemented**:
  - Created dedicated `components/ui/dashboard-background.tsx` with `pointer-events-none fixed inset-0 z-0 overflow-hidden`.
  - Scoped strictly to role dashboard layout shells (`app/customer/layout.tsx`, `app/vendor/layout.tsx`, `app/superadmin/layout.tsx`).
  - Removed from all auth pages (`app/auth/page.tsx`, `app/vendor/auth/page.tsx`, `app/superadmin/auth/page.tsx`) and public landing page (`app/page.tsx`).
- **Key Files**: `components/ui/dashboard-background.tsx`, `app/customer/layout.tsx`, `app/vendor/layout.tsx`, `app/superadmin/layout.tsx`.
- **Verification**: `grep -rn "DashboardBackground" app/` strictly matches the 3 role dashboard layouts.

---

### [PROTECTED FIX 3] Mobile Vertical Scrolling & Touch Gesture Fluidity
- **Original Bug**: Users could not scroll vertically on mobile screens, especially on login forms or dashboard containers.
- **Root Cause**:
  1. Outer containers had `overflow-hidden` without `overflow-y-auto`.
  2. Horizontal scroll containers had `touch-pan-y` classes which confused mobile touch event dispatch.
  3. WebGL canvas did not have explicit `pointer-events-none`.
- **Fix Implemented**:
  - Replaced `overflow-hidden` with `overflow-x-hidden overflow-y-auto` on auth and page containers.
  - Removed `touch-pan-y` from `CategoryChips.tsx`, `StudentRecommendationsSection.tsx`, and `CanteenImageCarousel.tsx`.
  - Added `pointer-events-none select-none` to `<canvas>` in `components/ui/animated-background.tsx`.
  - Added `-webkit-overflow-scrolling: touch;` to `body` in `app/globals.css`.
- **Key Files**: `app/globals.css`, `components/ui/animated-background.tsx`, `components/student/CategoryChips.tsx`, `components/student/StudentRecommendationsSection.tsx`.
- **Verification**: Mobile device allows seamless vertical scrolling with keyboard open.

---

### [PROTECTED FIX 4] Popular Around Campus Quantity Stepper
- **Original Bug**: Popular items on Student Dashboard only had a static "+ Quick Add" button; adding items did not show quantity decrement/increment counters synced with the cart.
- **Root Cause**: Component did not read item quantity reactively from `useCart().items`.
- **Fix Implemented**:
  - Subscribed directly to `useCart()`. Derived quantity from `cart.items.find(i => i.menuItemId === item.itemId)`.
  - Renders "+ Quick Add" when qty is 0, and "− {qty} +" when qty > 0.
- **Key Files**: `components/student/StudentRecommendationsSection.tsx`.
- **Verification**: `npx tsx --env-file=.env.local tests/popular_around_campus_stepper.test.ts` (12/12 PASSED).

---

### [PROTECTED FIX 5] Unified Food + Stall Search
- **Original Bug**: Search bar on Student Dashboard only matched stall names, ignoring dish names and food categories.
- **Root Cause**: Filtering logic was restricted strictly to canteen objects.
- **Fix Implemented**:
  - Built `lib/search/unifiedSearch.ts` with fuzzy Levenshtein distance, prefix matching, phonetic/alias dictionary (`Chai` -> `Tea`, `Maggi` -> `Noodles`), and multi-attribute ranking.
  - Returns separate sections for matching dishes and matching stalls with highlight badges.
- **Key Files**: `lib/search/unifiedSearch.ts`, `components/student/StudentDashboardClient.tsx`, `components/student/search/FoodSearchResultCard.tsx`.
- **Verification**: `npx tsx tests/unified_search.test.ts` (19/19 PASSED).

---

### [PROTECTED FIX 6] Server-Authoritative Wallet Cancellation Refund
- **Original Bug**: Cancelling a wallet-paid order before vendor preparation did not automatically restore wallet balance.
- **Root Cause**: Client-side cancellation mutation only updated order status without triggering financial ledger reversal.
- **Fix Implemented**:
  - Implemented `lib/orders/refundService.ts` backed by Supabase RPC / transaction security.
  - Guaranteed idempotency, balance credit, and audit transaction creation.
- **Key Files**: `lib/orders/refundService.ts`.
- **Verification**: `npx tsx --env-file=.env.local tests/order_cancellation_refund.test.ts` (15/15 PASSED).

---

### [PROTECTED FIX 7] Duplicate Push Notification Elimination
- **Original Bug**: Android device received 2 duplicate push notifications for each order status transition.
- **Root Cause**: FCM payload contained both a `notification` key (handled by Android OS system tray) and a `data` key (handled by foreground Capacitor JS listener).
- **Fix Implemented**:
  - Standardized FCM payload to data-only messages for custom in-app handling, unified on channel `grabit_orders_channel_v1`.
- **Key Files**: `lib/notifications/student_push_service.ts`, `lib/notifications/push_client.ts`, `android/app/src/main/java/app/grabit/student/MainActivity.java`.

---

### [PROTECTED FIX 8] Single Search Clear Button (Suppressed Browser Pseudo-Elements)
- **Original Bug**: When typing queries in the Student search bar, two X/clear icons appeared side by side.
- **Root Cause**: `<input type="search">` triggered Chromium/WebKit's native `::-webkit-search-cancel-button` alongside the custom GRABIT circular `✕` button.
- **Fix Implemented**:
  - Globally disabled `::-webkit-search-cancel-button` and `::-ms-clear` in `app/globals.css`.
  - Added utility classes `[&::-webkit-search-cancel-button]:hidden` to search inputs in `StudentDashboardClient.tsx`.
- **Key Files**: `app/globals.css`, `components/student/StudentDashboardClient.tsx`.
- **Verification**: Typing "Maggi" on mobile displays exactly one circular `✕` button.

---

### [PROTECTED FIX 9] Time Bucket & Pack Label Display Formatting
- **Original Bug**: Recommendation pack label was displayed with an raw underscore as `LATE_NIGHT PACK`.
- **Root Cause**: Raw enum string `timeBucket` was directly rendered in JSX without whitespace formatting.
- **Fix Implemented**:
  - Replaced underscores with spaces in `StudentRecommendationsSection.tsx` (`{data.timeBucket.replace(/_/g, " ")} PACK`).
  - Formatted recommendation reason strings in `lib/supabase/student_recommendations.ts`.
- **Key Files**: `components/student/StudentRecommendationsSection.tsx`, `lib/supabase/student_recommendations.ts`.
- **Verification**: Displayed as `LATE NIGHT PACK` across both Website and Android App.

---

### [PROTECTED FIX 10] Campus Selector Modal Viewport & Bottom Margin
- **Original Bug**: "Choose Your Campus" sheet extended to the very bottom screen edge, causing the bottom campus item to be partially clipped by the mobile gesture bar.
- **Root Cause**: Modal was flush against the bottom edge (`p-0`, `max-h-[85dvh]`, `rounded-t-3xl`) without responsive safe-area offset.
- **Fix Implemented**:
  - Added safe floating padding `p-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]` and `max-h-[80dvh]` with all-around `rounded-3xl` borders.
  - Trimmed internal list padding to `pb-2` for a clean scroll boundary.
- **Key Files**: `components/student/CampusSelectorModal.tsx`.
- **Verification**: Modal floats cleanly above the system gesture bar on mobile with 0 clipped content.

---

### [PROTECTED FIX 11] Background Stacking & Guest Recommendation Fallback
- **Original Bug**: Student dashboard rendered a blank area where hero headline ("Crave it. Grab it.") and "Popular Around Campus" cards were missing.
- **Root Cause**:
  1. `DashboardBackground` container was set to `z-0` instead of `-z-10`, causing in-flow static content without relative positioning to be painted behind the solid background gradient.
  2. `/api/student/recommendations` returned `401 Unauthorized` when requested without an active session cookie instead of gracefully falling back to campus-level popular picks.
- **Fix Implemented**:
  - Set `DashboardBackground` and `AnimatedBackground` containers to `fixed inset-0 -z-10`.
  - Updated `/api/student/recommendations/route.ts` to gracefully return public campus popular recommendations for guest/fresh-start sessions.
- **Key Files**: `components/ui/dashboard-background.tsx`, `components/ui/animated-background.tsx`, `app/api/student/recommendations/route.ts`.
- **Verification**: Screen captured on device confirms all sections (`Crave it. Grab it.`, `Popular Around Campus`, `LATE NIGHT PACK`, food cards, category chips, and stall banners) are completely visible.

---

### [PROTECTED FIX 12] Resilient Native Offline Auto-Recovery & Multi-Target Prober
- **Original Bug**: Android app dropped to "You're Offline" when ADB reverse socket momentarily reset during rebuilds or USB re-negotiations.
- **Root Cause**: WebView running `file:///android_asset/public/offline.html` had no native bridge to probe alternate origins (Wi-Fi LAN IP / USB localhost) and couldn't bypass WebView CORS/navigation constraints.
- **Fix Implemented**:
  - Implemented `AndroidOfflineBridge` and `performProbeAndReconnect` in `MainActivity.java` with multi-endpoint probing (`localhost:3000` via USB + `192.168.29.205:3000` via Wi-Fi + SharedPreferences last working URL).
  - Added background auto-retry loop in Java whenever `offline.html` is shown that automatically reloads the WebView the moment any candidate endpoint responds with HTTP < 500.
  - Added persistent host watchdog daemon (`scripts/adb-reverse-watchdog.sh`) to maintain `adb reverse tcp:3000 tcp:3000`.
- **Key Files**: `android/app/src/main/java/app/grabit/student/MainActivity.java`, `public/offline.html`, `scripts/adb-reverse-watchdog.sh`.
- **Verification**: App auto-reconnects seamlessly on physical device across USB resets and network fluctuations.

---

## 3. Canonical Development Commands

Run all commands from root `/Users/gopaljidwivedi/GRABIT-WHHG`:

```bash
# Start local web development server
npm run dev

# Run complete production compilation & typecheck
npm run build

# Run all regression test suites
npx tsx tests/unified_search.test.ts
npx tsx --env-file=.env.local tests/order_cancellation_refund.test.ts
npx tsx --env-file=.env.local tests/popular_around_campus_stepper.test.ts

# Mobile port forwarding & APK deployment
adb reverse tcp:3000 tcp:3000
GRABIT_WEB_URL="http://localhost:3000" npx cap sync android
cd android && ./gradlew installDebug
```

---

## 4. Instructions for Future AI Sessions

When starting a new session:
1. **DO NOT** execute destructive commands (`git reset --hard`, `git checkout .`, `git restore .`).
2. Read this `docs/REGRESSION_SAFETY.md` before making architectural or layout modifications.
3. Run the automated test suites (`npx tsx tests/...`) before proposing refactors.
4. Keep Student, Vendor, and Super Admin surfaces strictly separated.
