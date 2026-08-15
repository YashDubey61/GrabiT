# GrabIt Operational Incident Response Runbook

## 1. Overview

This document provides operational guidelines and response procedures for engineering and operations teams handling production incidents on the GRABIT Campus Canteen platform.

- **Status**: Verified Operational & Post-Go-Live Stable ✅
- **Telemetry Integration**: Super Admin Ops (`/superadmin/operations`), Notifications (`/superadmin/notifications`), Reconciliation (`/superadmin/reconciliation`)
- **Health Endpoint**: `GET /api/health`

---

## 2. Incident Scenarios & Response Runbooks

### 2.1 Application Outage (Next.js / HTTP 5xx Spikes)
- **Detection**: Vercel health monitoring triggers alert; `GET /api/health` returns HTTP 500 or times out.
- **Immediate Containment**:
  1. Check Vercel deployment status and recent build deployments.
  2. Inspect Vercel runtime logs for uncaught exceptions or memory exhaustion.
  3. If broken build deployed, immediately initiate rollback in Vercel Dashboard to previous successful commit (`Promote to Production`).
- **Recovery Procedure**:
  - Re-run `npm run build` locally to reproduce build/runtime error.
  - Apply emergency patch and push hotfix commit.
- **Post-Incident Verification**: Query `GET /api/health` -> Confirm HTTP 200 `{ "status": "ok" }`.

### 2.2 Database Outage / Connection Drop (Supabase PostgreSQL)
- **Detection**: `GET /api/health` returns HTTP 503 `{ "status": "degraded", "services": { "database": "degraded" } }`. API endpoints return database timeout errors.
- **Immediate Containment**:
  1. Inspect Supabase Dashboard status metrics (CPU, Memory, Connection Pooler).
  2. Check Supabase platform status page for regional infrastructure outages.
  3. Enable connection pooling (`pgBouncer`) if direct connection limit is exhausted.
- **Recovery Procedure**:
  - Restart connection pooler or database instance via Supabase Dashboard.
- **Post-Incident Verification**: Execute read-only query on `campuses` table -> Confirm connection restoration.

### 2.3 Payment Gateway Failure (Razorpay API Errors)
- **Detection**: Elevated error logs in `app/api/payments/razorpay/order/route.ts` or `app/api/payments/razorpay/verify/route.ts`. Student checkout displays "Razorpay service unavailable".
- **Immediate Containment**:
  1. Verify Razorpay API status at [status.razorpay.com](https://status.razorpay.com).
  2. Confirm `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correctly configured in deployment environment.
  3. Ensure student wallet payment flow (`paymentMethod === 'wallet'`) remains functional as primary fallback.
- **Recovery Procedure**:
  - If credentials expired/revoked, rotate keys in Razorpay Dashboard and update deployment environment variables.
- **Post-Incident Verification**: Execute Razorpay order creation test -> Confirm HTTP 200 response with valid `razorpayOrderId`.

### 2.4 Razorpay Webhook Failure (Signature Mismatch / Delivery Drop)
- **Detection**: `payment_webhook_events` logs webhook status as `signature_failed` or events fail to process. Students report paid GrabIt Gold subscriptions not activating.
- **Immediate Containment**:
  1. Inspect raw webhook logs in Razorpay Dashboard (`Webhooks` tab).
  2. Confirm `RAZORPAY_WEBHOOK_SECRET` in environment variables matches configured secret in Razorpay Dashboard.
  3. Verify raw body verification in `app/api/webhooks/razorpay/route.ts` uses `request.text()` (not pre-parsed JSON).
- **Recovery Procedure**:
  - Execute manual reconciliation endpoint `POST /api/payments/razorpay/reconcile` (Super Admin authorized only) for affected payments.
  - Re-trigger failed webhooks from Razorpay Dashboard (`Resend Webhook`).
- **Post-Incident Verification**: Check `payment_webhook_events.event_id` -> Confirm status is `processed`.

### 2.5 Wallet Inconsistency / Balance Race Condition
- **Detection**: Student reports incorrect wallet balance or double-spend log.
- **Immediate Containment**:
  1. DO NOT manually edit wallet balance via client code or SQL `UPDATE` without auditing ledger.
  2. Inspect PostgreSQL RPC `debit_student_wallet` definition in Supabase database.
  3. Confirm `FOR UPDATE` row locking is active on `wallets` table row during debit operations.
- **Recovery Procedure**:
  - Calculate authoritative balance: `initial_balance + SUM(topup/refund/bonus) - SUM(spend)` from `wallet_transactions`.
  - Re-apply atomic RPC migration `0004_wallet_security_hardening.sql` if RPC was modified.
- **Post-Incident Verification**: Execute concurrent debit tests -> Confirm non-winning concurrent request is rejected (`400 Bad Request`).

### 2.6 Authentication Service Outage (Supabase Auth)
- **Detection**: `supabase.auth.getUser()` throws 5xx errors; students/vendors unable to log in.
- **Immediate Containment**:
  1. Inspect Supabase Auth logs and status page.
  2. Confirm JWT secret and anon key match configuration.
- **Recovery Procedure**:
  - Clear stale client sessions; instruct users to re-authenticate once Auth service restores.
- **Post-Incident Verification**: Authenticate test student account -> Confirm `auth.uid()` matches `public.users.id`.

### 2.7 Vendor Portal Outage / Order Board Sync Failure
- **Detection**: Vendor reports new placed orders not appearing on `/vendor` order board.
- **Immediate Containment**:
  1. Check `getAuthenticatedVendorContext()` response for vendor account.
  2. Verify vendor `canteen_id` matches order `canteen_id`.
  3. Ensure server-side polling / refetch triggers are active.
- **Recovery Procedure**:
  - Instruct vendor to force-refresh order board (`Refresh Orders` button).
- **Post-Incident Verification**: Create test student order -> Confirm instant appearance on vendor order board.

### 2.8 Security Incident / IDOR Attempt / Secret Exposure
- **Detection**: Security logs record repeated `403 Forbidden` responses on `PATCH /api/vendor/menu/[id]` or `PATCH /api/vendor/orders/[id]` from unauthorized IP/user.
- **Immediate Containment**:
  1. If service role key or API secret is leaked in git or client log: IMMEDIATELY rotate keys in Supabase/Razorpay dashboards.
  2. Block abusive IP/user ID in Supabase Auth / WAF firewall rules.
  3. Verify all vendor APIs enforce `getAuthenticatedVendorContext()` and canteen ownership check.
- **Recovery Procedure**:
  - Audit codebase for `"use client"` secret imports (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`).
  - Deploy hotfix with key rotation.
- **Post-Incident Verification**: Re-run Day 28 security attack suite -> Confirm 100% blocked.

### 2.9 Data Integrity Anomaly / Orphan Financial Record
- **Detection**: Audit query identifies `orders` without corresponding `order_items` or `payments` without `orders`.
- **Immediate Containment**:
  1. Identify root cause (e.g., partial failure during multi-table insertion).
  2. Ensure `POST /api/orders` rolls back created order if wallet debit or line item insertion fails.
- **Recovery Procedure**:
  - Execute audit script to mark incomplete orders as `cancelled`.
- **Post-Incident Verification**: Verify `orders` table -> Confirm 0 orphan records.

---

## 3. Incident Severity Matrix

| Severity | Impact | Escalation Target | SLA Response Time |
| :--- | :--- | :--- | :--- |
| **SEV-1 (CRITICAL)** | Total platform outage, database down, payment/wallet double-spend. | Lead Engineer & Ops Lead | Immediate (< 15 mins) |
| **SEV-2 (HIGH)** | Partial outage (e.g., Razorpay down, vendor board sync delay). | Lead Engineer | < 1 hour |
| **SEV-3 (MEDIUM)** | Non-blocking UI defect, single vendor dashboard glitch. | On-Call Engineer | < 4 hours |
| **SEV-4 (LOW)** | Minor typo, non-critical telemetry delay. | Engineering Team | < 24 hours |
