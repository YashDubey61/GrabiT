# GrabIt Vendor Performance, SLA & Operational Intelligence Report

## 1. Executive Summary & Architecture Overview

Day 44 delivers a production-grade Vendor Performance, SLA & Operational Intelligence layer for Super Admin on the GrabIt Campus Canteen OS platform.

**Key Operational Capabilities**:
- **Deterministic Vendor Performance Score (0-100)**: Evaluates order completion, preparation SLA compliance, customer demand, menu availability, cancellation rates, revenue contribution, order volume, and payment reliability using transparent mathematical weights.
- **Preparation SLA Analytics**: Computes average prep time, median prep time, P90 prep time, SLA compliance %, breach count & breach percentage from real order status lifecycle timestamps (`placed` → `preparing` → `ready` → `completed`).
- **Real-Time Aging Backlog Buckets**: Tracks orders in 5 aging buckets (`0-5 min`, `5-10 min`, `10-20 min`, `20-30 min`, `30+ min`), oldest order age, and critical backlog count.
- **Menu Availability Intelligence**: Tracks available vs unavailable items, menu availability %, stock-out items, and historical menu revenue strictly using `order_items.price_at_order * quantity`. Current `menu_items.price` is never used for historical calculations.
- **Campus Operational Health & Peak-Hour Intelligence**: Aggregates campus health scores (0-100) and pinpoints Demand Peak vs Operational Stress windows.
- **Multi-Tag Vendor Segmentation & Benchmarking**: Multi-tag classification (`TOP_PERFORMER`, `HIGH_GROWTH`, `HIGH_VOLUME`, `HIGH_REVENUE`, `OPERATIONAL_RISK`, `LOW_AVAILABILITY`, `LOW_CONVERSION`, `DECLINING`, `NEW_VENDOR`, `STABLE`).
- **Interactive Vendor Detail Modal**: Enables Super Admin to click any vendor in the leaderboard table to view a deep-dive breakdown of category scores, financials, prep times, backlog aging, and top menu items.
- **Zero PII & Read-Only Financial Safety**: Zero student names, emails, phone numbers, or raw user IDs are exposed. 0 database mutations occur during analytics execution.

---

## 2. Vendor Performance Score Methodology

The Vendor Performance Score (0-100) uses a weighted multi-domain model:

| Category | Weight | Target Criteria / Metric |
| :--- | :--- | :--- |
| **Order Completion** | 20% | Completed orders / total orders ratio |
| **Preparation SLA** | 20% | Orders prepared within SLA threshold % |
| **Customer Demand** | 15% | Successful orders / order placement ratio |
| **Menu Availability** | 10% | In-stock menu items / total menu items % |
| **Cancellation Rate** | 10% | Inverse of order cancellation rate % |
| **Revenue Contribution** | 10% | Food GMV contribution volume |
| **Order Volume** | 10% | Successful order count volume |
| **Payment Reliability** | 5% | Payment gateway success rate |

### Grade Mapping
- `90 - 100`: **Excellent**
- `75 - 89`: **Healthy**
- `60 - 74`: **Watch**
- `40 - 59`: **At Risk**
- `0 - 39`: **Critical**

---

## 3. Aging Backlog Buckets & SLA Methodology

- **0-5 min Bucket**: Active orders placed/preparing within 5 minutes.
- **5-10 min Bucket**: Active orders preparing within 10 minutes.
- **10-20 min Bucket**: Orders approaching SLA threshold.
- **20-30 min Bucket**: Orders breaching SLA threshold.
- **30+ min Bucket**: Critical backlog orders requiring immediate operator intervention.

---

## 4. Super Admin API Security & Identity Isolation

Implemented API endpoint [`app/api/superadmin/vendor-performance/route.ts`](file:///Users/gopaljidwivedi/GRABIT-WHHG/app/api/superadmin/vendor-performance/route.ts):

- **Role Guard**: Enforces `getAuthenticatedSuperAdminContext()` via `auth.uid() -> public.users.role === 'admin'`.
- **HTTP Status Codes**:
  - Unauthenticated requests → `401 Unauthorized`.
  - Non-admin requests (Students/Vendors) → `403 Forbidden`.
  - Invalid timeframe parameters → `400 Bad Request`.
  - Authorized Super Admin → `200 OK`.
- **Identity Isolation**: Query parameters attempting to spoof roles or scopes (`?role=admin`, `?user_id=...`, `?canteen_id=...`, `?campus_id=...`) are explicitly ignored.

---

## 5. Privacy & Read-Only Financial Audit

- **Privacy Audit**: Passed. Zero student names, emails, phone numbers, delivery addresses, passwords, auth tokens, or raw user/vendor credentials exist in response payloads.
- **Financial Immutability**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts`, `canteens`, and `menu_items` remain 100% unmutated.

---

## 6. QA & Verification Results

- **`npm run lint`**: Passed cleanly with **0 errors and 0 warnings**.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all **44 static and dynamic routes** (`/superadmin/vendor-performance` and `/api/superadmin/vendor-performance` added).

---

## 7. Operational Status

**VENDOR PERFORMANCE & OPERATIONAL INTELLIGENCE READY** ✅
