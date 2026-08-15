# GrabIt Student Retention, Cohort & Growth Analytics Report

## 1. Executive Summary & Architecture Overview

Day 41 delivers a production-grade Student Retention, Cohort & Growth Analytics system for Super Admin on the GrabIt Campus Canteen OS platform.

**Key Analytics Capabilities**:
- **Active User Metrics**: DAU, WAU, MAU, and DAU/MAU Engagement Ratio.
- **Growth & Repeat Metrics**: New active students, returning active students, repeat customers (>=2 food orders), one-time customers, and repeat order rate %.
- **Time to Second Order**: Median and average days between a student's 1st and 2nd successful food orders.
- **Retention Cohorts Table**: Weekly cohort tracking (Day 1, Day 7, Day 14, Day 30 retention). Respects event tracking start date (`August 15, 2026`).
- **User Lifecycle Segmentation**: Deterministic segmentation (`New`, `Activated`, `Returning`, `Loyal`, `At Risk`, `Dormant`).
- **Campus Retention Ranking**: Ranked campus repeat ordering rate, active students, and 7d/30d retention.
- **Zero PII & Read-Only Financial Safety**: Zero student names, emails, phone numbers, or raw user IDs are exposed. 0 database mutations occur during analytics execution.

---

## 2. Active User & Retention Definitions

### Active User Metrics
- **DAU (Daily Active Users)**: Unique students with meaningful event or order activity created today.
- **WAU (Weekly Active Users)**: Unique students with meaningful activity in the last 7 days.
- **MAU (Monthly Active Users)**: Unique students with meaningful activity in the last 30 days.
- **DAU/MAU Engagement Ratio**: `(DAU / MAU) * 100` expressed as an engagement density percentage.

### Repeat Ordering & Time to 2nd Order
- **Repeat Customer**: Student with >= 2 successful food orders (`status != 'cancelled'`).
- **One-Time Customer**: Student with 1 successful food order.
- **Repeat Order Rate**: `(Repeat Customers / (Repeat Customers + One-Time Customers)) * 100`.
- **Time to Second Order**: Time delta between `order1.created_at` and `order2.created_at` in days (calculated as both median and average).

### User Lifecycle Segments
1. **New Registered**: Registered within the last 7 days.
2. **Activated**: Placed 1 successful food order.
3. **Returning**: Placed 2-3 successful food orders.
4. **Loyal Enthusiasts**: Placed 4+ successful food orders.
5. **At Risk**: Placed >=1 order previously, but zero orders in the last 14 days.
6. **Dormant**: Registered student with no order or meaningful event activity in the last 30 days.

---

## 3. Super Admin API Security & Identity Isolation

Implemented API endpoint [`app/api/superadmin/retention/route.ts`](file:///Users/gopaljidwivedi/GRABIT-WHHG/app/api/superadmin/retention/route.ts):

- **Role Guard**: Enforces `getAuthenticatedSuperAdminContext()` via `auth.uid() -> public.users.role === 'admin'`.
- **HTTP Status Codes**:
  - Unauthenticated requests → `401 Unauthorized`.
  - Non-admin requests (Students/Vendors) → `403 Forbidden`.
  - Invalid timeframe parameters → `400 Bad Request`.
  - Authorized Super Admin → `200 OK`.
- **Identity Isolation**: Query parameters attempting to spoof roles or user IDs (`?role=admin`, `?user_id=...`, `?student_id=...`) are explicitly ignored.

---

## 4. Privacy & Read-Only Financial Audit

- **Privacy Audit**: Passed. Zero student names, emails, phone numbers, delivery addresses, passwords, auth tokens, or raw user IDs exist in response payloads.
- **Financial Immutability**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts`, `canteens`, and `menu_items` remain 100% unmutated.

---

## 5. QA & Verification Results

- **`npm run lint`**: Passed cleanly with **0 errors and 0 warnings**.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all **41 static and dynamic routes** (`/api/superadmin/retention` added).

---

## 6. Operational Status

**RETENTION & COHORT ANALYTICS READY** ✅
