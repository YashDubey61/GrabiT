# GRABIT — Campus Canteen OS

> **When Hunger Hits, GrabIt.** Pickup-first food ordering, wallet payments, vendor operations, and multi-campus admin operating system for Indian universities.

---

## 🌟 Platform Status: PRODUCTION HARDENED ✅

GrabIt is a full-stack, production-grade campus canteen platform built with Next.js (App Router), React, Supabase PostgreSQL with Row Level Security (RLS), and Razorpay payments.

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

---

## 🛠️ Technology Stack

- **Core**: Next.js (Turbopack, App Router, React Server Components)
- **UI & Styling**: React, Vanilla CSS design tokens (`globals.css`), TailwindCSS, Material Symbols Outlined icons.
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
