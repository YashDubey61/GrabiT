# GrabIt Product Event Instrumentation & Conversion Analytics Report

## 1. Executive Summary & Architecture Overview

Day 40 introduces a production-grade, privacy-safe, first-party product event instrumentation system for the GrabIt Campus Canteen OS.

**Key Design Guarantees**:
- **Zero Student PII**: No email, phone number, address, passwords, auth tokens, wallet balances, or Razorpay secrets are stored in analytics events.
- **Fail-Safe & Non-Blocking**: Event tracking is best-effort (`lib/analytics/events.ts`). Analytics network or database failures will **never** roll back orders, fail wallet debits, or disrupt primary user transactions.
- **Server-Authoritative Identity**: Ingestion API `POST /api/analytics/events` derives `user_id` and `role` strictly from server authentication (`auth.uid() -> public.users`). Client-supplied identity overrides are ignored.
- **Rate Limited & Throttled**: Server-side rate limiter enforces a max boundary of 30 events/min per client IP to prevent event spamming.

---

## 2. Event Taxonomy & Database Model

Implemented migration [`supabase/migrations/0014_product_analytics_events.sql`](file:///Users/gopaljidwivedi/GRABIT-WHHG/supabase/migrations/0014_product_analytics_events.sql):

Table `public.product_analytics_events`:
- `id` (uuid, primary key)
- `event_name` (text, non-null)
- `anonymous_session_id` (text, optional)
- `user_id` (uuid, references `public.users(id)`)
- `role` (text)
- `campus_id` (uuid, references `public.campuses(id)`)
- `canteen_id` (uuid, references `public.canteens(id)`)
- `menu_item_id` (uuid, references `public.menu_items(id)`)
- `order_id` (uuid, references `public.orders(id)`)
- `metadata` (jsonb, max 4KB)
- `created_at` (timestamptz, default `now()`)

### Performance Indexes
- `idx_product_analytics_events_name`
- `idx_product_analytics_events_created_at`
- `idx_product_analytics_events_user_id`
- `idx_product_analytics_events_campus_id`
- `idx_product_analytics_events_canteen_id`
- `idx_product_analytics_events_order_id`

### Row Level Security (RLS)
- Super Admin read-only policy (`auth.uid() -> public.users.role === 'admin'`).
- Service role bypasses RLS for server API ingestion. Zero direct INSERT/UPDATE/DELETE access for anon, student, or vendor public roles.

---

## 3. Application Instrumentation Points

| Event Name | Trigger Context | Source | Payload Data |
| :--- | :--- | :--- | :--- |
| `student_home_viewed` | Student Home page view | Client Mount | `campus_id` |
| `menu_viewed` | Student Menu page view | Client Mount | `canteen_id` |
| `cart_item_added` | Item added to cart | Client Action | `menu_item_id`, `canteen_id`, `quantity` |
| `checkout_started` | Student enters checkout screen | Client Mount | `canteen_id` |
| `checkout_submitted` | Student clicks Pay & Place Order | Client Action | `canteen_id` |
| `order_created` | Successful order insertion | **Server API** (`POST /api/orders`) | `order_id`, `canteen_id`, `totalAmount` |
| `payment_started` | Payment process initiated | **Server API** (`POST /api/orders`) | `order_id`, `amount`, `paymentMethod` |
| `payment_succeeded` | Wallet/Razorpay payment success | **Server API** (`POST /api/orders` & `/verify`) | `order_id`, `amount`, `method` |
| `order_completed` | Vendor completes order | **Server API** (`PATCH /api/vendor/orders/[id]`) | `order_id`, `canteen_id` |
| `gold_plan_viewed` | Profile subscription view | Client Mount | None |
| `gold_purchase_started` | Gold plan checkout initiated | Client Action | `plan` |
| `gold_purchase_succeeded` | Gold subscription activated | **Server API** (`/verify` & `/webhooks/razorpay`) | `plan` |
| `wallet_viewed` | Wallet ledger view | Client Mount | None |
| `wallet_topup_started` | Wallet top-up initiated | Client Action | `amount` |

---

## 4. First-Party Conversion Funnel

The Super Admin Product Analytics UI (`/superadmin/analytics`) now renders the 8-stage real event conversion funnel:

1. **Student Home Views** (`student_home_viewed`)
2. **Menu Views** (`menu_viewed`)
3. **Cart Additions** (`cart_item_added`)
4. **Checkout Started** (`checkout_started`)
5. **Checkout Submitted** (`checkout_submitted`)
6. **Orders Created** (`order_created` - Server Authoritative)
7. **Payment Succeeded** (`payment_succeeded` - Server Authoritative)
8. **Orders Completed** (`order_completed` - Server Authoritative)

---

## 5. Security, Privacy & Financial Verification

- **Privacy Audit**: Passed. Zero emails, phone numbers, delivery addresses, passwords, auth tokens, or payment secrets exist in `product_analytics_events`.
- **Financial Immutability**: 0 financial mutations caused by analytics tracking. `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, and `subscriptions` remain 100% immutable.
- **Fail-Closed Authorization**: Unauthenticated calls to `GET /api/superadmin/analytics` return `401`. Student/vendor calls return `403`.

---

## 6. Operational Status

**PRODUCT EVENT INSTRUMENTATION READY** ✅
