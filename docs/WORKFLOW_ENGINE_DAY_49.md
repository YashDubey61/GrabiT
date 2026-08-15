# GrabIt Automated Operations, Workflow Engine & Scheduled Jobs Report

## 1. Executive Summary & Architecture Overview

Day 49 delivers a production-grade Automated Operations & Workflow Engine for the GrabIt Platform.

**Key Automated Workflow Capabilities**:
- **Deterministic Action Engine**: Converts real application events and scheduled operational checks into controlled, auditable actions (`CREATE_NOTIFICATION`, `ESCALATE_ALERT`, `AUTO_RESOLVE_ALERT`, `CREATE_OPERATIONAL_TASK`, `UPDATE_WORKFLOW_STATUS`).
- **10 Scheduled Operational Jobs**:
  1. Order aging detection (placed > 5m -> vendor warning, > 30m -> superadmin critical alert)
  2. Vendor SLA breach detection (< 90% SLA -> vendor performance alert)
  3. High kitchen backlog detection (> 10 orders -> critical alert)
  4. Menu availability detection (out-of-stock items -> vendor alert)
  5. GrabIt Gold 7d/3d/1d expiration reminders
  6. Wallet low balance reminders (< ₹100)
  7. Payment failure spike detection
  8. Webhook failure anomaly detection
  9. Financial reconciliation audit checks
  10. Vendor payout settlement dispatch
- **Strict Idempotency & Unique Execution Keys**: Unique constraint `(workflow_rule_id, execution_key)` in `public.workflow_executions` prevents duplicate rule evaluations for the same event window.
- **CRON_SECRET Protected Endpoint**: Endpoint `POST /api/internal/workflows/run` requires valid `CRON_SECRET` bearer token validation. Unauthenticated requests receive `401 Unauthorized`.
- **Fail-Safe Isolated Execution**: Every workflow action is executed inside an isolated `try/catch` block. Workflow failures will NEVER crash the application, disrupt order creation, or impact checkout/payment verification.
- **Super Admin Workflow Center**: Created `/superadmin/workflows` displaying Active Rules Count, Total Executions, Success Rate %, Failed Runs, Rule Enable/Disable Toggles, "Run Now" Manual Controls, and Workflow Detail Specification Modal.
- **Zero Financial Mutations**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts` remain 100% unmutated.

---

## 2. 10 Scheduled Workflow Jobs Matrix

| Job # | Event Trigger | Condition | Action Type | Recipient & Severity | Idempotency Key Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Job 1** | `ORDER_AGING_CHECK` | Placed > 5m / 30m | `ESCALATE_ALERT` | Vendor / Admin (`CRITICAL`) | `cron:order_aging:{date}` |
| **Job 2** | `VENDOR_SLA_CHECK` | SLA < 90% | `CREATE_NOTIFICATION` | Vendor (`WARNING`) | `cron:vendor_sla:{date}` |
| **Job 3** | `KITCHEN_BACKLOG_CHECK` | Backlog > 10 orders | `ESCALATE_ALERT` | Vendor (`CRITICAL`) | `cron:kitchen_backlog:{date}` |
| **Job 4** | `MENU_STOCK_CHECK` | Popular item out-of-stock | `CREATE_NOTIFICATION` | Vendor (`WARNING`) | `cron:menu_stock:{date}` |
| **Job 5** | `GOLD_EXPIRATION_CHECK` | 7d, 3d, 1d before renew | `CREATE_NOTIFICATION` | Student (`INFO`) | `cron:gold_expiration:{date}` |
| **Job 6** | `WALLET_BALANCE_CHECK` | Balance < ₹100 | `CREATE_NOTIFICATION` | Student (`INFO`) | `cron:wallet_balance:{date}` |
| **Job 7** | `PAYMENT_HEALTH_CHECK` | Failures > 15%/h | `ESCALATE_ALERT` | Admin (`CRITICAL`) | `cron:payment_health:{date}` |
| **Job 8** | `WEBHOOK_HEALTH_CHECK` | Failures > 3 | `ESCALATE_ALERT` | Admin (`CRITICAL`) | `cron:webhook_health:{date}` |
| **Job 9** | `RECONCILIATION_CHECK` | Mismatch detected | `ESCALATE_ALERT` | Admin (`CRITICAL`) | `cron:recon_check:{date}` |
| **Job 10** | `PAYOUT_CHECK` | Payout status updated | `CREATE_NOTIFICATION` | Vendor (`INFO`) | `cron:payout_check:{date}` |

---

## 3. Super Admin Security & RLS Isolation Model

Implemented API endpoints:
- `POST /api/internal/workflows/run` (CRON_SECRET protected)
- `GET /api/superadmin/workflows`
- `PATCH /api/superadmin/workflows/[id]`

**Security Enforcements**:
- **Role Guard**: Enforces `getAuthenticatedSuperAdminContext()`. Unauthenticated → `401`, non-admin → `403`.
- **Identity Isolation**: Student and Vendor roles have ZERO access to workflow configuration or audit tables (`workflow_rules`, `workflow_executions`).

---

## 4. Privacy & Read-Only Financial Audit

- **Privacy Audit**: Passed. Zero student names, emails, phone numbers, delivery addresses, passwords, auth tokens, or raw student IDs exist in workflow execution logs.
- **Financial Immutability**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts`, `canteens`, and `menu_items` remain 100% unmutated.

---

## 5. QA & Verification Results

- **`npm run lint`**: Passed cleanly with **0 errors and 0 warnings**.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all **52 static and dynamic routes** (`/superadmin/workflows` and API endpoints added).

---

## 6. Operational Status

**AUTOMATED OPERATIONS & WORKFLOW ENGINE READY** ✅
