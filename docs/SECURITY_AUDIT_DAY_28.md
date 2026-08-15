# GrabIt Day 28 Security Audit Report

## 1. Executive Summary

A comprehensive production security, authorization, RLS, financial integrity, and cross-role audit was conducted across all 30 pages and API routes of the GRABIT Campus Canteen platform. Critical vulnerabilities—including unauthenticated order placement fallbacks, cross-tenant vendor menu IDOR vulnerabilities, and order status transition IDOR vulnerabilities—were identified, remediated, and verified.

## 2. Security Findings & Remediation Summary

| ID | Severity | Area | Finding Description | Remediation Status | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | Orders API | `POST /api/orders` allowed unauthenticated requests to place orders under a demo student UUID fallback. | **FIXED**: Enforced strict `401 Unauthorized` response when `auth.getUser()` is null. | Tested & Passed |
| **SEC-02** | **CRITICAL** | Vendor Menu API | `PATCH /api/vendor/menu/[id]` allowed any caller to edit any menu item across canteens without checking vendor context or canteen ownership (B2B IDOR). | **FIXED**: Enforced `getAuthenticatedVendorContext()` and verified `dbItem.canteen_id === vendorCtx.canteenId` (`403 Forbidden` on mismatch). | Tested & Passed |
| **SEC-03** | **CRITICAL** | Vendor Orders API | `PATCH /api/vendor/orders/[id]` allowed any caller to transition the status of any order across canteens without checking vendor context or canteen ownership (B2B IDOR). | **FIXED**: Enforced `getAuthenticatedVendorContext()` and verified `currentOrder.canteen_id === vendorCtx.canteenId` (`403 Forbidden` on mismatch). | Tested & Passed |
| **SEC-04** | **HIGH** | Vendor Menu List API | `GET /api/vendor/menu` and `POST /api/vendor/menu` used a hardcoded fallback canteen ID without verifying vendor authentication. | **FIXED**: Enforced `getAuthenticatedVendorContext()` and scoped menu queries and inserts strictly to `vendorCtx.canteenId`. | Tested & Passed |
| **SEC-05** | **HIGH** | Vendor Auth Helper | `lib/supabase/vendor_auth.ts` returned fallback demo vendor context when caller was unauthenticated or missing vendor role. | **FIXED**: Updated helper to return `null` on unauthenticated/non-vendor sessions, ensuring all vendor endpoints fail closed. | Tested & Passed |
| **SEC-06** | **MEDIUM** | HTTP Security Headers | `next.config.ts` lacked standard HTTP security headers. | **FIXED**: Configured `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. | Tested & Passed |

---

## 3. Database RLS Policy Audit Matrix

| Database Table | RLS Enabled | Student Access | Vendor Access | Super Admin Access | Client Write Policy | Server Write Capability | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`users`** | YES | Own Profile Only | Own Profile Only | All Profiles | Own Profile Only (Role immutable) | Service Role | LOW |
| **`campuses`** | YES | Public Read | Public Read | All Campuses | Read-Only for Clients | Service Role / Admin | LOW |
| **`canteens`** | YES | Public Read | Own Canteen | All Canteens | Read-Only for Clients | Service Role / Admin | LOW |
| **`menu_items`** | YES | Public Read | Own Canteen Menu | All Menu Items | Read-Only for Clients | Service Role / Admin | LOW |
| **`orders`** | YES | Own Orders Only | Own Canteen Orders | All Orders | Read-Only for Clients | Service Role | LOW |
| **`order_items`** | YES | Own Order Items | Own Canteen Items | All Order Items | Read-Only for Clients | Service Role | LOW |
| **`wallets`** | YES | Own Wallet Only | Denied | All Wallets | Read-Only for Clients (Blocked) | PostgreSQL RPC `debit_student_wallet` | LOW |
| **`wallet_transactions`** | YES | Own Ledger Only | Denied | All Ledgers | Read-Only for Clients (Blocked) | PostgreSQL RPC `debit_student_wallet` | LOW |
| **`subscriptions`** | YES | Own Sub Only | Denied | All Subs | Read-Only for Clients (Blocked) | Verified Payment Webhook | LOW |
| **`payments`** | YES | Own Payments Only | Denied | All Payments | Read-Only for Clients (Blocked) | Service Role / Webhook | LOW |
| **`payouts`** | YES | Denied | Own Payouts Only | All Payouts | Read-Only for Clients | Service Role | LOW |
| **`payment_webhook_events`** | YES | Denied | Denied | Audit View | Read-Only for Clients (Fails Closed) | Service Role Only | LOW |
| **`vendor_approval_requests`** | YES | Denied | Read-Only | All Requests | Read-Only for Clients | Service Role / Admin | LOW |

---

## 4. Financial Integrity & Security Controls

1. **Wallet Atomic Debit & Double-Spend Protection**:
   - Wallet debits execute strictly via PostgreSQL RPC `debit_student_wallet` using `FOR UPDATE` row locking.
   - Balance check and ledger append occur within a single atomic database transaction, preventing race conditions or double-spend anomalies.
2. **Server-Authoritative Pricing**:
   - Food order prices are derived server-side from `menu_items.price`. Client-submitted prices are explicitly ignored.
   - GrabIt Gold plan prices (Monthly: ₹49 / Semester: ₹199) are hardcoded in server configuration (`GOLD_PLANS`) and cannot be manipulated by client request bodies.
3. **Razorpay Webhook HMAC Verification & Idempotency**:
   - Webhook signatures are verified against raw HTTP request bodies (`request.text()`) using `RAZORPAY_WEBHOOK_SECRET`.
   - Idempotency is guaranteed via unique constraint on `payment_webhook_events.event_id`, preventing duplicate subscription activations or replayed transactions.
4. **Historical Financial Immutability**:
   - Updating vendor commission rates or menu item prices modifies future configurations only. Historical `orders`, `order_items.price_at_order`, and `payouts` remain immutable.

---

## 5. Environment & Service Role Isolation

- **Secrets Audit**: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are stored strictly in server-side environment variables and are never imported or exposed in `"use client"` components.
- **Git Security**: `.env.local` is untracked and ignored in `.gitignore`. Zero credentials or secret tokens exist in git history.

---

## 6. Verification Results

- **`npm run lint`**: Executed cleanly with 0 errors and 0 warnings.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all 30 pages and API routes.
- **Security Tests Executed**:
  - Unauthenticated order placement attempt -> Rejected (`401 Unauthorized`).
  - Cross-tenant vendor menu edit attempt -> Rejected (`403 Forbidden`).
  - Cross-tenant vendor order status transition attempt -> Rejected (`403 Forbidden`).
  - Unauthenticated vendor menu & analytics access -> Rejected (`401 Unauthorized`).
  - Student role spoofing on Super Admin APIs -> Rejected (`403 Forbidden`).
  - Webhook HMAC signature tampering -> Rejected (`400 Bad Request`).
