# GrabIt Real User & Product Analytics Report

## 1. Executive Summary & Architecture Overview

This milestone introduces a production-grade **Real User & Product Analytics System** for Super Admin, providing platform operators with data-driven insights into student engagement, GMV velocity, canteen performance, ordering funnel conversion, wallet usage, and GrabIt Gold subscription adoption.

**Key Architecture Guarantee**:
- All metrics are calculated **read-only** from live Supabase production tables. Zero mock or fabricated analytics data.
- Historical revenue calculations strictly preserve financial integrity by using snapshot `order_items.price_at_order * quantity` (never current menu prices).
- Zero student PII (email, phone, address, auth tokens) is exposed in API responses or UI screens.

---

## 2. Server Data Architecture & Schema Aggregation

Analytics queries are encapsulated in `lib/supabase/product_analytics.ts`:

| Domain | Source Tables | Key Metrics Calculated |
| :--- | :--- | :--- |
| **User Analytics** | `users`, `orders` | Total/new registered students, active students, ordering students, repeat customer rate %. |
| **Orders & Revenue** | `orders`, `order_items` | Food GMV, completed/cancelled/pending orders, AOV, platform commission (15.2%), vendor payouts. |
| **Ordering Funnel** | `users`, `orders` | Measured stages: Registered → Ordering → Successful → Completed. Explicitly identifies uninstrumented cart/checkout view stages. |
| **Campus Analytics** | `campuses`, `canteens`, `orders` | Ranked campus GMV, orders, AOV, active vendors, campus GMV share %. |
| **Vendor Analytics** | `canteens`, `orders` | Ranked canteen GMV, orders, AOV, completion rate %. |
| **Menu Product Analytics** | `order_items`, `menu_items` | Top 10 selling menu items by units sold and historical revenue (`price_at_order * qty`). |
| **GrabIt Gold** | `subscriptions`, `users` | Active/expired subscribers, monthly (₹49) vs semester (₹199) breakdown, subscription revenue, adoption rate %. |
| **Wallet Ecosystem** | `wallets`, `wallet_transactions` | Active wallets, total balance, top-up volume, spend volume, avg spend per transaction, wallet food share %. |
| **Payment Gateway** | `payments` | Successful/failed/refunded payments, wallet vs Razorpay payment split, failure rate %. |

---

## 3. Timeframe Support & API Endpoint

The server API is exposed at `GET /api/superadmin/analytics?timeframe=today|7d|30d|90d`:

- **Timeframe Options**: `today` (current UTC day), `7d` (past 7 days), `30d` (past 30 days - default), `90d` (past 90 days).
- **Invalid Parameter Handling**: Requests with unsupported timeframes return `400 Bad Request`.
- **Cache Policy**: `Cache-Control: no-store, no-cache, must-revalidate`.

---

## 4. Authorization & Security Boundaries

- **Role Verification**: Enforces `getAuthenticatedSuperAdminContext()` via `auth.uid() -> public.users.role === 'admin'`.
- **Fail-Closed Responses**: Unauthenticated requests return `401 Unauthorized`. Authenticated student/vendor requests return `403 Forbidden`.
- **Parameter Tampering Isolation**: Client-supplied `user_id`, `role`, or `admin_id` URL query parameters or request headers are explicitly ignored.

---

## 5. Super Admin UI Surface (`/superadmin/analytics`)

Added **Product Analytics** tab to `SUPERADMIN_NAV` side rail in `app/superadmin/layout.tsx`:

1. **Header & Timeframe Controls**: Timeframe tabs (`Today`, `7 Days`, `30 Days`, `90 Days`), "Updated just now" timestamp, `Force Refresh` button.
2. **KPI Summary Grid**: Active Students, Total Orders, Gross GMV, Average Order Value (AOV), GrabIt Gold Subscribers, Repeat Customer Rate %.
3. **Ordering Funnel**: Visual progression displaying measured stages vs uninstrumented stages ("Not yet instrumented").
4. **Ranked Campus Table**: Campus rankings by GMV, order volume, and GMV share %.
5. **Ranked Vendor & Menu Tables**: Canteen completion rates and top selling menu items by historical revenue.
6. **Gold & Wallet Analytics**: Subscription adoption and wallet spend breakdown.

---

## 6. Financial Integrity & Verification

- **Historical Price Immutability**: Historical order items use `order_items.price_at_order`.
- **Revenue Separation**: Subscription payments are tracked separately from food GMV.
- **Zero Database Mutations**: All analytics operations are strictly read-only (`select` queries only).

---

## 7. Operational Status

**PRODUCT ANALYTICS READY & STABLE** ✅
