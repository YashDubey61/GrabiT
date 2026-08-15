# GrabIt Revenue, Unit Economics & Business Intelligence Report

## 1. Executive Summary & Architecture Overview

Day 42 delivers a production-grade Revenue, Unit Economics & Business Intelligence layer for Super Admin on the GrabIt Campus Canteen OS platform.

**Key Analytics Capabilities**:
- **Gross Merchandise Value (GMV)**: Total GMV, Food GMV (excluding cancelled orders), Gold GMV, Net Platform Revenue, Platform Commission, Vendor Payout Exposure.
- **Historical Price Snapshot Integrity**: Menu item revenue is calculated strictly using `order_items.price_at_order * quantity`. Current `menu_items.price` is never used for historical revenue calculations.
- **Period-over-Period Growth**: Calculates GMV Growth %, Order Growth %, Student Growth %, Gold Subscriber Growth %, and Revenue Growth % comparing the current timeframe against the immediately preceding equivalent period with zero-denominator safety.
- **Operational Unit Economics**: Revenue / Active Student, GMV / Active Student, Revenue / Order, Platform Revenue / Order, Vendor Payout / Order. Lifetime Value (LTV) is explicitly marked *"Not yet statistically reliable"*.
- **Payment Gateway & Wallet Economics**: Payment Success Rate %, Failure Rate %, Refund Rate %, Wallet Adoption %, Wallet GMV, Razorpay GMV, Gold Payment Share.
- **Revenue Concentration Risk**: Top 5 Campus GMV Share %, Top 5 Vendor GMV Share %, Top 10 Menu Item GMV Share %.
- **Zero PII & Read-Only Financial Safety**: Zero student names, emails, phone numbers, or raw user IDs are exposed. 0 database mutations occur during analytics execution.

---

## 2. Revenue Formulas & Business Definitions

### GMV & Revenue Formulas
- **Food GMV**: $\sum \text{total\_amount}$ of valid food orders (`status != 'cancelled'`).
- **Gold GMV**: Total revenue from successful GrabIt Gold subscriptions ($\text{Monthly} \times 49 + \text{Semester} \times 199$).
- **Total GMV**: $\text{Food GMV} + \text{Gold GMV}$.
- **Platform Commission**: $\text{Food GMV} \times 15.2\%$.
- **Net Platform Revenue**: $\text{Platform Commission} + \text{Gold GMV}$.
- **Vendor Payout Exposure**: $\text{Food GMV} - \text{Platform Commission}$.

### Period-over-Period Growth Rate (%)
$$\text{Growth \%} = \frac{\text{Current Period Value} - \text{Prior Period Value}}{\text{Prior Period Value}} \times 100$$
If Prior Period Value is 0, growth returns `100%` if Current > 0, else `0%`, eliminating `Infinity` or `NaN`.

---

## 3. Unit Economics & Concentration Risk

- **Revenue / Active Student**: `Net Revenue / Active Students`
- **GMV / Active Student**: `Total GMV / Active Students`
- **Orders / Active Student**: `Successful Orders / Active Students`
- **Platform Revenue / Order**: `Platform Commission / Successful Orders`
- **Vendor Payout / Order**: `Vendor Payout Exposure / Successful Orders`
- **LTV Status**: Explicitly labelled *"Not yet statistically reliable"* until long-term user cohorts mature.

### Revenue Concentration Metrics
- **Top 5 Campus GMV Share**: $\frac{\text{Sum of GMV for Top 5 Campuses}}{\text{Total Food GMV}} \times 100$
- **Top 5 Vendor GMV Share**: $\frac{\text{Sum of GMV for Top 5 Vendors}}{\text{Total Food GMV}} \times 100$
- **Top 10 Menu Item GMV Share**: $\frac{\text{Sum of Revenue for Top 10 Menu Items}}{\text{Total Food GMV}} \times 100$

---

## 4. Super Admin API Security & Identity Isolation

Implemented API endpoint [`app/api/superadmin/business-analytics/route.ts`](file:///Users/gopaljidwivedi/GRABIT-WHHG/app/api/superadmin/business-analytics/route.ts):

- **Role Guard**: Enforces `getAuthenticatedSuperAdminContext()` via `auth.uid() -> public.users.role === 'admin'`.
- **HTTP Status Codes**:
  - Unauthenticated requests → `401 Unauthorized`.
  - Non-admin requests (Students/Vendors) → `403 Forbidden`.
  - Invalid timeframe parameters → `400 Bad Request`.
  - Authorized Super Admin → `200 OK`.
- **Identity Isolation**: Query parameters attempting to spoof roles or canteen scopes (`?role=admin`, `?user_id=...`, `?canteen_id=...`) are explicitly ignored.

---

## 5. Privacy & Read-Only Financial Audit

- **Privacy Audit**: Passed. Zero student names, emails, phone numbers, delivery addresses, passwords, auth tokens, or raw user IDs exist in response payloads.
- **Financial Immutability**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts`, `canteens`, and `menu_items` remain 100% unmutated.

---

## 6. QA & Verification Results

- **`npm run lint`**: Passed cleanly with **0 errors and 0 warnings**.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all **42 static and dynamic routes** (`/api/superadmin/business-analytics` added).

---

## 7. Operational Status

**REVENUE & BUSINESS INTELLIGENCE READY** ✅
