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
