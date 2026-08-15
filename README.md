# GRABIT — Campus Canteen OS

> **When Hunger Hits, GrabIt.** Pickup-first food ordering, wallet payments, vendor operations, and multi-campus admin operating system for Indian universities.

---

## 🌟 Platform Status: PRODUCTION HARDENED ✅

GrabIt is a full-stack, production-grade campus canteen platform built with Next.js 16 (App Router), React 19, Supabase PostgreSQL with Row Level Security (RLS), and Razorpay payments.

- **Security & Performance Report**: [`docs/PRODUCTION_SECURITY_PERFORMANCE_DAY_58.md`](docs/PRODUCTION_SECURITY_PERFORMANCE_DAY_58.md)
- **Launch Stabilization Report**: [`docs/PRODUCTION_STABILITY_DAY_57.md`](docs/PRODUCTION_STABILITY_DAY_57.md)
- **Go-Live Certification Report**: [`docs/PRODUCTION_ACCEPTANCE_DAY_56.md`](docs/PRODUCTION_ACCEPTANCE_DAY_56.md)
- **Disaster Recovery Report**: [`docs/DISASTER_RECOVERY_DAY_55.md`](docs/DISASTER_RECOVERY_DAY_55.md)
- **Production Observability Report**: [`docs/PRODUCTION_OBSERVABILITY_DAY_54.md`](docs/PRODUCTION_OBSERVABILITY_DAY_54.md)
- **Incident SLA Escalation Report**: [`docs/INCIDENT_SLA_ESCALATION_DAY_53.md`](docs/INCIDENT_SLA_ESCALATION_DAY_53.md)
- **Operational Incident Report**: [`docs/INCIDENT_CENTER_DAY_52.md`](docs/INCIDENT_CENTER_DAY_52.md)
- **Workflow Activation Report**: [`docs/WORKFLOW_ENGINE_DAY_51.md`](docs/WORKFLOW_ENGINE_DAY_51.md)
- **Workflow Hardening Report**: [`docs/WORKFLOW_ENGINE_DAY_50.md`](docs/WORKFLOW_ENGINE_DAY_50.md)
- **Workflow Engine Report**: [`docs/WORKFLOW_ENGINE_DAY_49.md`](docs/WORKFLOW_ENGINE_DAY_49.md)
- **Operational Notifications Report**: [`docs/OPERATIONAL_NOTIFICATIONS_DAY_48.md`](docs/OPERATIONAL_NOTIFICATIONS_DAY_48.md)
- **Student Notifications Report**: [`docs/STUDENT_NOTIFICATIONS_DAY_47.md`](docs/STUDENT_NOTIFICATIONS_DAY_47.md)
- **Vendor Growth Report**: [`docs/VENDOR_GROWTH_ANALYTICS_DAY_46.md`](docs/VENDOR_GROWTH_ANALYTICS_DAY_46.md)
- **Student Personalization Report**: [`docs/STUDENT_PERSONALIZATION_DAY_45.md`](docs/STUDENT_PERSONALIZATION_DAY_45.md)
- **Vendor Performance Report**: [`docs/VENDOR_OPERATIONAL_INTELLIGENCE_DAY_44.md`](docs/VENDOR_OPERATIONAL_INTELLIGENCE_DAY_44.md)
- **Decision Support Report**: [`docs/BUSINESS_INTELLIGENCE_DAY_43.md`](docs/BUSINESS_INTELLIGENCE_DAY_43.md)
- **Business Intelligence Report**: [`docs/BUSINESS_ANALYTICS_DAY_42.md`](docs/BUSINESS_ANALYTICS_DAY_42.md)
- **Student Retention Report**: [`docs/RETENTION_ANALYTICS_DAY_41.md`](docs/RETENTION_ANALYTICS_DAY_41.md)
- **Event Instrumentation Report**: [`docs/PRODUCT_EVENT_INSTRUMENTATION_DAY_40.md`](docs/PRODUCT_EVENT_INSTRUMENTATION_DAY_40.md)
- **Product Analytics Report**: [`docs/PRODUCT_ANALYTICS_DAY_39.md`](docs/PRODUCT_ANALYTICS_DAY_39.md)
- **Monitoring Report**: [`docs/POST_GO_LIVE_MONITORING_DAY_39.md`](docs/POST_GO_LIVE_MONITORING_DAY_39.md)
- **Go-Live Report**: [`docs/GO_LIVE_REPORT_DAY_38.md`](docs/GO_LIVE_REPORT_DAY_38.md)
- **Deployment Runbook**: [`docs/PRODUCTION_DEPLOYMENT.md`](docs/PRODUCTION_DEPLOYMENT.md)
- **Incident Response**: [`docs/INCIDENT_RESPONSE.md`](docs/INCIDENT_RESPONSE.md)

### Live Role Surface Sitemap

- **Landing Page**: [`/`](http://localhost:3000/) — Live landing page showcasing campus highlights, features, and quick role access.
- **Student App**:
  - [`/student`](http://localhost:3000/student) — Live student home with header notification bell badge, personalized recommendations ("Order Again", "Popular at Campus", "Trending Now"), canteen directory & campus context.
  - [`/student/notifications`](http://localhost:3000/student/notifications) — Live Student Notification Center with category tabs (Orders, Payments, Wallet, Gold, Recommendations), unread count, Mark All Read, and Notification Preferences Modal.
  - [`/student/menu`](http://localhost:3000/student/menu) — Live food menu with contextual recommendations, category filters, availability badges, and search.
  - [`/student/checkout`](http://localhost:3000/student/checkout) — Server-authoritative checkout with wallet/UPI options.
  - [`/student/orders`](http://localhost:3000/student/orders) — Live order history & active order status tracking.
  - [`/student/orders/[id]`](http://localhost:3000/student/orders/1) — Live pickup lane ETA tracker (`placed` → `preparing` → `ready` → `completed`).
  - [`/student/profile`](http://localhost:3000/student/profile) — Live student profile & GrabIt Gold subscription badge.
  - [`/student/wallet`](http://localhost:3000/student/wallet) — Live atomic student wallet & transaction ledger.
- **Vendor App**:
  - [`/vendor`](http://localhost:3000/vendor) — Live active order management board & status lifecycle state machine.
  - [`/vendor/notifications`](http://localhost:3000/vendor/notifications) — Live Vendor Operational Notification Center with category filters (Orders, SLA, Menu, Payouts, Performance), open/acknowledged/resolved status badges, Acknowledge & Resolve actions.
  - [`/vendor/menu`](http://localhost:3000/vendor/menu) — Live vendor menu CRUD, price edits, and stock availability toggles.
  - [`/vendor/analytics`](http://localhost:3000/vendor/analytics) — Live vendor sales analytics, growth intelligence, peak-hour stress windows, dish deep-dive modal, privacy-safe campus benchmarks, hourly volume chart, top items, and payout CSV export.
- **Super Admin App**:
  - [`/superadmin`](http://localhost:3000/superadmin) — Live global dashboard telemetry (GMV, active students, active campuses, platform commission).
  - [`/superadmin/campuses`](http://localhost:3000/superadmin/campuses) — Live campus management & status registry.
  - [`/superadmin/vendors`](http://localhost:3000/superadmin/vendors) — Live vendor oversight hub, commission rate manager, tier toggles, and approval queue.
  - [`/superadmin/vendor-performance`](http://localhost:3000/superadmin/vendor-performance) — Deterministic Vendor Performance Score (0-100), preparation SLA compliance, aging backlog buckets (0-5m to 30m+), vendor growth signals, menu stock-outs, campus health, peak-hour stress windows, vendor detail modal.
  - [`/superadmin/operations`](http://localhost:3000/superadmin/operations) — Live production observability, automated workflow engine telemetry, incident center summary & business operations.
  - [`/superadmin/workflows`](http://localhost:3000/superadmin/workflows) — Live Production Workflow Center with Vercel Cron integration, cadence filters, health badge, staleness indicators, rules table, enable/disable toggles, "Run Now" manual controls, audit execution log, and Workflow Detail Modal.
  - [`/superadmin/incidents`](http://localhost:3000/superadmin/incidents) — Live Operational Incident Center with human-readable numbers (`INC-2026-XXXXXX`), SLA countdown badges (`● ON TRACK`, `● AT RISK`, `● BREACHED`), category filters, acknowledge/escalate/resolve controls, and Incident Detail & Timeline Modal.
  - [`/superadmin/analytics`](http://localhost:3000/superadmin/analytics) — Notification performance (Dispatched, Read Rate %), Recommendation conversion performance (CTR %), Business Health Score (0-100), short-term GMV/Order forecasts, opportunity engines, prioritized action center, DAU/WAU/MAU retention & first-party event conversion funnel analytics.
  - [`/superadmin/notifications`](http://localhost:3000/superadmin/notifications) — Live operational notification center, platform SLA alerts, reconciliation findings, alert acknowledgement, and resolution audit trail.
  - [`/superadmin/reconciliation`](http://localhost:3000/superadmin/reconciliation) — Deterministic read-only financial reconciliation & payout integrity engine.

---

## 🛠️ Technology Stack

- **Core**: Next.js 16.3.1 (Turbopack, App Router, React Server Components)
- **UI & Styling**: React 19, Vanilla CSS design tokens (`globals.css`), TailwindCSS v4, Google Fonts (Montserrat + Sora), Material Symbols Outlined icons.
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth (`@supabase/ssr`), Row Level Security (RLS), Security Definer RPC (`debit_student_wallet`).
- **Payment Gateway**: Razorpay Checkout SDK, HMAC SHA-256 Webhook Verification (`POST /api/webhooks/razorpay`), Event Idempotency.
- **Workflow Scheduler**: Vercel Cron (`vercel.json`), `CRON_SECRET` Bearer Authorization, Cadence-based Job Dispatch.

---

## 🚀 Commands & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run ESLint check
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```
